import { useEffect, useState, useRef, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeleteCable } from '../../../../hooks/useApi';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert
} from '@mui/material';

type MarkerData = {
  latitude: number;
  longitude: number;
  cut_id: string;
  cut_type: string;
  distance: number;
  depth?: string;
  simulated: string;
  fault_date?: string;
  cable_type?: string; // <-- Add this
};

type CableCutMarkersProps = {
  cableSegment: string; // e.g., "seaus1", "seaus2", "seaus3"
};

function CableCutMarkers({ cableSegment }: CableCutMarkersProps) {
  const map = useMap();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  // Track hover close timeouts per marker so popup doesn't disappear instantly
  const hoverCloseTimeoutsRef = useRef<{ [key: string]: number | null }>({});
  const queryClient = useQueryClient();

  // Inject CSS to hide Leaflet popup default background for our custom popups
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cnfm-cut-popup-styles')) return;
    const style = document.createElement('style');
    style.id = 'cnfm-cut-popup-styles';
    style.innerHTML = `
      /* Remove default Leaflet popup wrapper background so our card shows only */
      .cnfm-cut-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
      .cnfm-cut-popup .leaflet-popup-tip { background: transparent !important; box-shadow: none !important; }
      .cnfm-cut-popup .leaflet-popup-close-button { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  // Effect to check permissions on component mount and localStorage changes
  useEffect(() => {
    const checkPermissions = () => {
      setCanDelete(canDeleteMarkers());
    };

    // Check permissions initially
    checkPermissions();

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loggedIn' || e.key === 'user_role') {
        checkPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Optional: Also listen for custom events if you update localStorage in the same tab
    const handleCustomStorageUpdate = () => {
      checkPermissions();
    };

    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'localStorageUpdate',
        handleCustomStorageUpdate
      );
    };
  }, []);

  // Use central mutation hook so deletedCables + lastUpdate are invalidated globally
  const deleteMutation = useDeleteCable();

  // removeMarker will open confirmation dialog instead of deleting immediately
  const removeMarker = (cutId: string) => openDeleteDialog(cutId);

  // Confirmation dialog state for deleting markers (mirrors DeletedCablesSidebar flow)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cutId: string | null }>({
    open: false,
    cutId: null
  });

  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const hideNotification = () => setNotification(prev => ({ ...prev, open: false }));

  const openDeleteDialog = (cutId: string) => setDeleteDialog({ open: true, cutId });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, cutId: null });

  const handleConfirmDelete = async () => {
    const cutId = deleteDialog.cutId;
    if (!cutId) {
      showNotification('Invalid cut id', 'error');
      closeDeleteDialog();
      return;
    }

    try {
      // call the centralized delete mutation and await
      await deleteMutation.mutateAsync(cutId);
      showNotification('Cable deleted successfully', 'success');

      // close any open popup and cleanup marker if still present
      const m = markersRef.current[cutId] as any;
      try {
        if (m) {
          if (typeof m._customEventCleanup === 'function') {
            try { m._customEventCleanup(); } catch (e) { /* ignore */ }
          }
          if (typeof (m.closePopup) === 'function') {
            m.closePopup();
          }
          map.removeLayer(m);
          delete markersRef.current[cutId];
        }
      } catch (err) {
        // ignore cleanup errors
      }
      // Also invalidate the segment-specific cableCuts query so markers list updates
      queryClient.invalidateQueries({ queryKey: ['cableCuts', cableSegment] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      console.error('Error deleting cut:', msg);
      showNotification(msg, 'error');
    } finally {
      closeDeleteDialog();
    }
  };

  // Use TanStack Query to fetch cable cuts with polling and caching
  const fetchCuts = async () => {
    const res = await fetch(`${apiBaseUrl}${port}/fetch-cable-cuts`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch cable cuts');
    }
    return res.json();
  };

  const { data: cutsRaw = [], isFetching } = useQuery({
    queryKey: ['cableCuts', cableSegment],
    queryFn: fetchCuts,
    // Poll for changes. Adjust interval as necessary for performance.
    refetchInterval: 2000,
    staleTime: 5000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Derive markers for this segment from cached query data
  const queriedMarkers = useMemo(() => {
    if (!Array.isArray(cutsRaw)) return [] as MarkerData[];
    return cutsRaw
      .filter(
        (item: any) =>
          item.cut_id && typeof item.cut_id === 'string' && item.cut_id.includes(cableSegment)
      )
      .map((item: any) => ({
        latitude: item.latitude,
        longitude: item.longitude,
        cut_id: item.cut_id,
        cut_type: item.cut_type,
        distance: item.distance,
        depth: item.depth,
        simulated: item.simulated,
        fault_date: item.fault_date,
        cable_type: item.cable_type
      }));
  }, [cutsRaw, cableSegment]);

  // Keep local markers in sync with query-derived markers (preserve previous behaviour)
  useEffect(() => {
    setMarkers(queriedMarkers);
  }, [queriedMarkers]);

  // Effect to manage markers based on data changes
  useEffect(() => {
    // Get current marker IDs from data
    const currentMarkerIds = new Set(markers.map((marker) => marker.cut_id));

    // Remove markers that are no longer in the data
    Object.keys(markersRef.current).forEach((markerId) => {
      if (!currentMarkerIds.has(markerId)) {
        // Remove marker from map
        if (markersRef.current[markerId]) {
          map.removeLayer(markersRef.current[markerId]);
          delete markersRef.current[markerId];
        }
      }
    });

    // Add/update markers that are in the data
    markers.forEach((markerData) => {
      const markerId = markerData.cut_id;
      // Check if marker already exists and if data has changed
      const existingMarker = markersRef.current[markerId];
      const hasDataChanged =
        !existingMarker ||
        existingMarker.getLatLng().lat !== markerData.latitude ||
        existingMarker.getLatLng().lng !== markerData.longitude ||
        existingMarker.options.icon?.options.className !==
        `cut-marker-${markerData.cut_type}-${cableSegment}`;

      // Only recreate marker if it doesn't exist or data has changed
      if (hasDataChanged) {
        // Remove existing marker if present
        if (existingMarker) {
          map.removeLayer(existingMarker);
        }

        // Create new marker
        const markerStyle = getMarkerStyle(markerData.cut_type);
        const depth = markerData.depth || 'Unknown';
        const position: [number, number] = [
          markerData.latitude,
          markerData.longitude
        ];

        const marker = L.marker(position, {
          icon: L.divIcon({
            className: `cut-marker-${markerData.cut_type}-${cableSegment}`,
            html: `
              <div style="
                position: relative;
                width: ${markerStyle.size}px; 
                height: ${markerStyle.size}px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  color: ${markerStyle.color};
                  font-size: ${markerStyle.size - 4}px;
                  font-weight: bold;
                  text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(255,255,255,0.8);
                  line-height: 1;
                ">✕</div>
              </div>
            `,
            iconSize: [markerStyle.size, markerStyle.size],
            iconAnchor: [markerStyle.size / 2, markerStyle.size / 2]
          })
        });

        // --- Restore hover popup functionality ---
        // Format date/time
        const dateObj = markerData.fault_date ? new Date(markerData.fault_date) : null;
        const dateStr = dateObj && !isNaN(dateObj.getTime())
          ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj)
          : 'Unknown';
        const hasTime = markerData.fault_date ? markerData.fault_date.includes('T') : false;
        const timeStr = dateObj && !isNaN(dateObj.getTime()) && hasTime
          ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dateObj)
          : '--';
        // Safely format distance
        let distanceStr = 'N/A';
        if (typeof markerData.distance === 'number' && !isNaN(markerData.distance)) {
          distanceStr = markerData.distance.toFixed(2) + ' km';
        } else if (typeof markerData.distance === 'string') {
          const distStr = markerData.distance as string;
          if (distStr.trim() !== '' && !isNaN(Number(distStr))) {
            distanceStr = Number(distStr).toFixed(2) + ' km';
          }
        }

        // Choose header color based on cut type
        const headerColors: { [k: string]: string } = {
          'Shunt Fault': '#f9a825',
          'Partial Fiber Break': '#fb8c00',
          'Fiber Break': '#f44336',
          'Full Cut': '#c62828'
        };
        const headerColor = headerColors[markerData.cut_type] || '#c62828';
        const headerText = markerData.cut_type ? markerData.cut_type.toUpperCase() : 'FULL CUT';

        // Popup HTML content (table-based design matching requested layout)
        const popupHtml = `
      <div class="cable-cut-popup" style="font-family: Arial, sans-serif; width: 200px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 5px; overflow: hidden; border: 2px solid ${markerStyle.color};">
        <div style="background-color: ${markerStyle.color}; color: white; padding: 6px; text-align: center; font-weight: bold; font-size: 13px; letter-spacing: 0.3px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
          ${markerData.cut_type ? markerData.cut_type.toUpperCase() : 'FULL CUT'}
        </div>
        <div style="background-color: white; padding: 10px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Distance:</td>
              <td style="text-align: right; padding-bottom: 5px; color: #666;">${distanceStr}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Depth:</td>
              <td style="text-align: right; padding-bottom: 5px; color: #666;">${Number(depth || 0).toFixed(1)} m</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Lat:</td>
              <td style="text-align: right; padding-bottom: 5px; color: #666; font-family: monospace; font-size: 11px;">${Number(markerData.latitude).toFixed(4)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Lng:</td>
              <td style="text-align: right; padding-bottom: 5px; color: #666; font-family: monospace; font-size: 11px;">${Number(markerData.longitude).toFixed(4)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Date:</td>
              <td style="text-align: right; padding-bottom: 2px; color: #666; font-size: 11px;">${dateStr}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Time:</td>
              <td style="text-align: right; padding-bottom: 5px; color: #666; font-size: 11px;">${timeStr}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-bottom: 5px; color: #333;">Cable Type:</td>
              <td style="text-align: right; padding-bottom: 5px; color: #666; font-size: 11px;">${markerData.cable_type || 'Unknown'}</td>
            </tr>
          </table>
        </div>
        ${canDelete ? `
        <div style="background-color: #f8f9fa; padding: 10px; border-top: 1px solid #dee2e6; display: flex; flex-direction: column; gap: 6px;">
          <button id="delete-cut-${markerId}" class="delete-marker-btn" onclick="(function(){const e=new CustomEvent('popupDeleteCable',{detail:{cutId:'${markerId}'}});document.dispatchEvent(e);})();" style="background-color: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">🗑️ Delete</button>
          <button id="close-cut-${markerId}" class="close-popup-btn" onclick="(function(){const e=new CustomEvent('popupClose');document.dispatchEvent(e);})();" style="background-color: #6c757d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">✕ Close</button>
        </div>
        ` : `
        <div style="background-color: #f8f9fa; padding: 10px; border-top: 1px solid #dee2e6;">
          <button id="close-cut-${markerId}" class="close-popup-btn" onclick="(function(){const e=new CustomEvent('popupClose');document.dispatchEvent(e);})();" style="background-color: #6c757d; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">✕ Close</button>
        </div>
        `}
      </div>
    `;
        marker.bindPopup(popupHtml, { closeButton: false, autoPan: true, className: 'cnfm-cut-popup' });

        // Open popup on hover, close after a short delay on mouseout so users can move
        // cursor between marker and popup without it disappearing instantly.
        marker.on('mouseover', function () {
          // Clear any pending close timeout for this marker
          if (hoverCloseTimeoutsRef.current[markerId]) {
            clearTimeout(hoverCloseTimeoutsRef.current[markerId]!);
            hoverCloseTimeoutsRef.current[markerId] = null;
          }
          marker.openPopup();
        });
        marker.on('mouseout', function () {
          // Delay closing to allow pointer to move to the popup
          hoverCloseTimeoutsRef.current[markerId] = window.setTimeout(() => {
            marker.closePopup();
            hoverCloseTimeoutsRef.current[markerId] = null;
          }, 300);
        });

        // Handle Delete and Close button clicks, and attach hover listeners to popup
        marker.on('popupopen', function () {
          if (canDelete) {
            const deleteBtn = document.getElementById(`delete-cut-${markerId}`);
            if (deleteBtn) {
              deleteBtn.onclick = (e) => {
                e.preventDefault();
                removeMarker(markerId);
                marker.closePopup();
              };
            }
          }
          const closeBtn = document.getElementById(`close-cut-${markerId}`);
          if (closeBtn) {
            closeBtn.onclick = (e) => {
              e.preventDefault();
              marker.closePopup();
            };
          }

          // Attach hover enter/leave to popup element so it doesn't close when
          // moving cursor between marker and popup.
          try {
            const popup = typeof (marker.getPopup) === 'function' ? marker.getPopup() : undefined;
            const popupEl = popup && typeof (popup.getElement) === 'function' ? popup.getElement() : undefined;
            if (popupEl) {
              const onPopupEnter = () => {
                if (hoverCloseTimeoutsRef.current[markerId]) {
                  clearTimeout(hoverCloseTimeoutsRef.current[markerId]!);
                  hoverCloseTimeoutsRef.current[markerId] = null;
                }
              };
              const onPopupLeave = () => {
                hoverCloseTimeoutsRef.current[markerId] = window.setTimeout(() => {
                  marker.closePopup();
                  hoverCloseTimeoutsRef.current[markerId] = null;
                }, 300);
              };

              popupEl.addEventListener('mouseenter', onPopupEnter);
              popupEl.addEventListener('mouseleave', onPopupLeave);

              // store cleanup so we can remove listeners on popupclose
              (marker as any)._popupHoverCleanup = () => {
                try {
                  popupEl.removeEventListener('mouseenter', onPopupEnter);
                  popupEl.removeEventListener('mouseleave', onPopupLeave);
                } catch (e) {
                  // ignore
                }
                if (hoverCloseTimeoutsRef.current[markerId]) {
                  clearTimeout(hoverCloseTimeoutsRef.current[markerId]!);
                  hoverCloseTimeoutsRef.current[markerId] = null;
                }
              };
            }
          } catch (err) {
            // ignore DOM errors
          }
        });

        marker.on('popupclose', function () {
          if ((marker as any)._popupHoverCleanup) {
            try {
              (marker as any)._popupHoverCleanup();
            } catch (e) {
              // ignore
            }
            delete (marker as any)._popupHoverCleanup;
          }
        });

        // Add to map and store reference
        marker.addTo(map);
        markersRef.current[markerId] = marker;

        // Wire up central popup delete/close events (same pattern as DeletedCablesSidebar)
        const handlePopupDeleteEvent = (event: CustomEvent) => {
          const cutId = event.detail?.cutId;
          if (cutId === markerId) {
            try {
              // Open confirmation dialog instead of immediate deletion
              openDeleteDialog(markerId);
            } catch (e) {
              console.error('Error handling popup delete event', e);
              showNotification('Error initiating delete', 'error');
            }
          }
        };

        const handlePopupCloseEvent = () => {
          try {
            marker.closePopup();
          } catch (e) {
            // ignore
          }
        };

        document.addEventListener('popupDeleteCable', handlePopupDeleteEvent as EventListener);
        document.addEventListener('popupClose', handlePopupCloseEvent);

        (marker as any)._customEventCleanup = () => {
          document.removeEventListener('popupDeleteCable', handlePopupDeleteEvent as EventListener);
          document.removeEventListener('popupClose', handlePopupCloseEvent);
        };
      }
    });
  }, [markers, map, cableSegment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all markers when component unmounts
      Object.values(markersRef.current).forEach((marker) => {
        try {
          map.removeLayer(marker);
        } catch (e) {
          // ignore
        }
      });
      markersRef.current = {};

      // Clear any pending hover close timeouts
      Object.keys(hoverCloseTimeoutsRef.current).forEach((k) => {
        const t = hoverCloseTimeoutsRef.current[k];
        if (t) {
          try {
            clearTimeout(t);
          } catch (e) {
            // ignore
          }
        }
      });
      hoverCloseTimeoutsRef.current = {};
    };
  }, [map]);

  // Helper function to check if user can delete markers
  const canDeleteMarkers = () => {
    try {
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
      if (!isLoggedIn) return false;

      // Get user role from localStorage
      const userRole = localStorage.getItem('user_role');
      if (!userRole) return false;

      // Define roles that can delete markers
      const allowedRoles = ['administrator', 'simulator'];
      return allowedRoles.includes(userRole.toLowerCase());
    } catch (error) {
      // Handle cases where localStorage is not available or throws an error
      console.error('Error accessing localStorage:', error);
      return false;
    }
  };
  // Helper functions moved to component level
  const getMarkerStyle = (cutType: string) => {
    const styles = {
      'Shunt Fault': { color: '#FBC02D', size: 20, borderColor: 'white' }, // Darker Yellow
      'Partial Fiber Break': {
        color: '#FF6600',
        size: 20,
        borderColor: 'white'
      }, // Orange
      'Fiber Break': { color: '#F44336', size: 20, borderColor: 'white' }, // Red
      'Full Cut': { color: '#B71C1C', size: 20, borderColor: 'white' } // Maroon
    };

    return (
      styles[cutType] || { color: '#9E9E9E', size: 20, borderColor: 'white' }
    );
  };

  return (
    <>
      {/* Dialog to confirm deletion from popup (mirrors DeletedCablesSidebar UX) */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
          ⚠️ Confirm Cable Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to permanently delete this cable?
            <br />
            <br />
            This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeDeleteDialog} variant="outlined" color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={hideNotification} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={hideNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default CableCutMarkers;
