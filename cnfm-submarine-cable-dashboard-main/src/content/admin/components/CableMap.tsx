import { Box, Typography, IconButton, Paper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import SeaUS from '../dashboard/SeaUS';
import SJC from '../dashboard/SJC';
import C2C from '../dashboard/C2C';
import TGNIA from '../dashboard/TGNIA';
import JapanMarker from './JapanMarker';
import HongkongMarker from './HongkongMarker';
import SingaporeMarker from './SingaporeMarker';
import USAMarker from './USAMarker';
import SimulationButton from '../../environment/components/SimulationButton';
import DeletedCablesSidebar from './DeletedCablesSidebar';
import HideToolTip from './HideToolTip';
import RPLSeaUS1 from '../dashboard/RoutePositionList/RPLSeaUS1';
import RPLSeaUS2 from '../dashboard/RoutePositionList/RPLSeaUS2';
import RPLSeaUS3 from '../dashboard/RoutePositionList/RPLSeaUS3';
import RPLSJC1 from '../dashboard/RoutePositionList/RPLSJC1';
import RPLSJC3 from '../dashboard/RoutePositionList/RPLSJC3';
import RPLSJC4 from '../dashboard/RoutePositionList/RPLSJC4';
import RPLSJC5 from '../dashboard/RoutePositionList/RPLSJC5';
import RPLSJC6 from '../dashboard/RoutePositionList/RPLSJC6';
import RPLSJC7 from '../dashboard/RoutePositionList/RPLSJC7';
import RPLSJC8 from '../dashboard/RoutePositionList/RPLSJC8';
import RPLSJC9 from '../dashboard/RoutePositionList/RPLSJC9';
import RPLSJC10 from '../dashboard/RoutePositionList/RPLSJC10';
import RPLSJC11 from '../dashboard/RoutePositionList/RPLSJC11';
import RPLSJC12 from '../dashboard/RoutePositionList/RPLSJC12';
import RPLSJC13 from '../dashboard/RoutePositionList/RPLSJC13';
import RPLTGNIA1 from '../dashboard/RoutePositionList/RPLTGNIA1';
import RPLTGNIA2 from '../dashboard/RoutePositionList/RPLTGNIA2';
import RPLTGNIA3 from '../dashboard/RoutePositionList/RPLTGNIA3';
import RPLTGNIA4 from '../dashboard/RoutePositionList/RPLTGNIA4';
import RPLTGNIA5 from '../dashboard/RoutePositionList/RPLTGNIA5';
import RPLTGNIA6 from '../dashboard/RoutePositionList/RPLTGNIA6';
import RPLTGNIA7 from '../dashboard/RoutePositionList/RPLTGNIA7';
import RPLTGNIA8 from '../dashboard/RoutePositionList/RPLTGNIA8';
import RPLTGNIA9 from '../dashboard/RoutePositionList/RPLTGNIA9';
import RPLTGNIA10 from '../dashboard/RoutePositionList/RPLTGNIA10';
import RPLTGNIA11 from '../dashboard/RoutePositionList/RPLTGNIA11';
import RPLTGNIA12 from '../dashboard/RoutePositionList/RPLTGNIA12';
import RPLSeaUS4 from '../dashboard/RoutePositionList/RPLSeaUS4';
import RPLSeaUS5 from '../dashboard/RoutePositionList/RPLSeaUS5';
import RPLSeaUS6 from '../dashboard/RoutePositionList/RPLSeaUS6';

// Import TanStack Query hooks
import {
  useDataSummary,
  useIpopUtilization,
  useLastUpdate,
  useDeleteCable,
  usePrefetchData
} from '../../../hooks/useApi';

function ChangeView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);

  return null;
}

type DynamicMarkerProps = {
  position: [number, number];
  label: string;
  icon?: L.Icon;
};

const DynamicMarker = React.memo(({ position, label, icon }: DynamicMarkerProps) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | L.CircleMarker | null>(null);

  useEffect(() => {
    if (!position || !Array.isArray(position) || position.length !== 2) return;

    // Clean up existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Create pane if it doesn't exist
    if (!map.getPane('markerPane')) {
      map.createPane('markerPane');
      map.getPane('markerPane')!.style.zIndex = '650';
    }

    let marker: L.Marker | L.CircleMarker;

    try {
      if (icon) {
        marker = L.marker(position, {
          icon,
          pane: 'markerPane'
        });
      } else {
        marker = L.circleMarker(position, {
          radius: 4,
          color: 'gray',
          fillColor: 'white',
          fillOpacity: 1,
          pane: 'markerPane'
        });
      }

      if (label) {
        marker.bindTooltip(
          `<span style="font-size: 14px; font-weight: bold;">${label}</span>`,
          {
            direction: 'top',
            offset: icon ? [0, -30] : [0, -10],
            permanent: false,
            opacity: 1
          }
        );
      }

      marker.addTo(map);
      markerRef.current = marker;
    } catch (error) {
      console.error('Error creating dynamic marker:', error);
    }

    return () => {
      if (markerRef.current) {
        try {
          map.removeLayer(markerRef.current);
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
        markerRef.current = null;
      }
    };
  }, [position, map, label, icon]);

  return null;
});

const RemoveAttribution = React.memo(() => {
  const map = useMap();

  useEffect(() => {
    try {
      if (map && map.attributionControl) {
        map.attributionControl.remove();
      }
    } catch (error) {
      console.warn('Error removing attribution control:', error);
    }
  }, [map]);

  return null;
});

interface CableMapProps {
  selectedCable?: any;
  selectedCutType?: string | null;
  mapRef?: React.RefObject<L.Map>;
  onCloseCablePopup?: () => void;
  setLastUpdate?: (val: string) => void;
}

// Error boundary wrapper component
const CableMapErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('CableMap Error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Map Loading Error
        </Typography>
        <Typography variant="body2" color="textSecondary">
          There was an error loading the cable map. Please refresh the page or contact support.
        </Typography>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </Box>
    );
  }

  return <>{children}</>;
};

const CableMap: React.FC<CableMapProps> = ({
  selectedCable,
  selectedCutType,
  mapRef: externalMapRef,
  onCloseCablePopup,
  setLastUpdate: externalSetLastUpdate,
}) => {
  // State management with better initialization
  const [mapHeight, setMapHeight] = useState('600px');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Refs for cleanup
  const mapRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-leaflet-focus-fix', 'true');
    style.textContent = `
      .leaflet-interactive:focus {
        outline: none;
      }
      .leaflet-interactive {
        transition: filter 0.15s ease, stroke-width 0.15s ease, opacity 0.15s ease;
      }
      .segment-highlight {
        filter: brightness(1.25);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // TanStack Query hooks for data fetching
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats
  } = useDataSummary();

  const {
    data: ipopData,
    isLoading: isIpopLoading,
    error: ipopError,
    refetch: refetchIpop
  } = useIpopUtilization();

  const {
    data: lastUpdate,
    isLoading: isLastUpdateLoading,
    error: lastUpdateError,
    refetch: refetchLastUpdate
  } = useLastUpdate();

  // Mutation for deleting cables
  const deleteCableMutation = useDeleteCable();

  // Prefetch hook for performance
  const { prefetchDataSummary, prefetchIpopUtilization } = usePrefetchData();

  // Environment variables with fallbacks
  const apiConfig = useMemo(() => ({
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost',
    port: process.env.REACT_APP_PORT || ':8081',
    mapApiKey: process.env.REACT_APP_GEOAPIFY_API_KEY || ''
  }), []);

  // Memoized stats with fallback values
  const stats = useMemo(() => {
    if (statsData) {
      return statsData;
    }
    return {
      data: [],
      totalGbps: 0,
      avgUtilization: 0,
      zeroUtilizationCount: 0
    };
  }, [statsData]);

  // Memoized IPOP data with fallback values
  const { ipopUtilization, ipopDifference } = useMemo(() => {
    if (ipopData) {
      return {
        ipopUtilization: ipopData.utilization,
        ipopDifference: ipopData.difference
      };
    }
    return {
      ipopUtilization: '0%',
      ipopDifference: ''
    };
  }, [ipopData]);

  // Optimized formatDate function with memoization
  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  // Optimized delete cable function with TanStack Query mutation
  const handleDeleteCable = useCallback(async (cable: any) => {
    if (!cable?.cut_id) {
      alert('Invalid cable data');
      return;
    }

    try {
      console.log('Making delete request for cable:', cable.cut_id);

      const result = await deleteCableMutation.mutateAsync(cable.cut_id);
      console.log('Delete response:', result);

      if (result.success) {
        // Update the lastUpdate to trigger refresh in sidebar if it exists
        const updateFunction = externalSetLastUpdate;
        if (updateFunction) {
          updateFunction(Date.now().toString());
        }
        alert('Cable deleted successfully!');
        // Close the popup by clearing selected cable
        if (onCloseCablePopup) {
          onCloseCablePopup();
        }
        // Manually refetch to ensure immediate UI update
        refetchStats();
        refetchLastUpdate();
      } else {
        alert('Failed to delete cable: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting cable:', error);
      alert('Error deleting cable: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [deleteCableMutation, externalSetLastUpdate, onCloseCablePopup, refetchStats, refetchLastUpdate]);

  // Optimized map height calculation
  const updateMapHeight = useCallback(() => {
    const screenWidth = window.innerWidth;
    if (screenWidth > 1600) {
      setMapHeight('800px');
    } else if (screenWidth > 1200) {
      setMapHeight('700px');
    } else {
      setMapHeight('600px');
    }
  }, []);

  // Initialize map height on mount
  useEffect(() => {
    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);
    return () => {
      window.removeEventListener('resize', updateMapHeight);
    };
  }, [updateMapHeight]);

  // Prefetch data on component mount for better performance
  useEffect(() => {
    prefetchDataSummary();
    prefetchIpopUtilization();
  }, [prefetchDataSummary, prefetchIpopUtilization]);

  // Sync external lastUpdate prop with query result
  useEffect(() => {
    if (externalSetLastUpdate && lastUpdate) {
      externalSetLastUpdate(lastUpdate);
    }
  }, [lastUpdate, externalSetLastUpdate]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Loading state for critical data
  const isLoading = isStatsLoading || isIpopLoading;

  // Error state - only show if there are critical errors
  if (statsError && !statsData) {
    console.error('Critical error loading stats:', statsError);
  }

  if (ipopError && !ipopData) {
    console.error('Error loading IPOP data:', ipopError);
  }

  return (
    <CableMapErrorBoundary>
      <Box sx={{ position: 'relative', width: '100%', height: mapHeight }}>
        {/* Loading overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }}
          >
            <Typography variant="h6">Loading map data...</Typography>
          </Box>
        )}

        {/* Left sidebar toggle button - moved below zoom controls */}
        {!sidebarOpen && (
          <IconButton
            sx={{ position: 'absolute', top: 78, left: 10, zIndex: 1200, background: '#fff', boxShadow: 2 }}
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Show Deleted Cables Sidebar"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Right sidebar toggle button */}
        <IconButton
          sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1200, background: '#fff', boxShadow: 2 }}
          onClick={() => setRightSidebarOpen((open) => !open)}
          aria-label="Show Info Sidebar"
        >
          <InfoIcon />
        </IconButton>

        {/* Left Sidebar - Deleted Cables */}
        {sidebarOpen && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: 360,
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 4,
              borderRadius: '1px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.7)',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out',
              animation: 'slideInFromLeft 0.3s ease-out',
              '@keyframes slideInFromLeft': {
                '0%': {
                  transform: 'translateX(-100%)',
                  opacity: 0,
                },
                '100%': {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
              },
            }}
          >
            <DeletedCablesSidebar
              onSelectCable={(cable) => {
                // Let DeletedCablesSidebar handle all map positioning internally
                // Don't interfere with map panning to avoid conflicts
                // console.log('Cable selected and positioned:', cable);
              }}
              lastUpdate={lastUpdate || undefined}
              setLastUpdate={(val: string) => {
                if (externalSetLastUpdate) {
                  externalSetLastUpdate(val);
                }
                // Force refetch of lastUpdate query to stay in sync
                refetchLastUpdate();
              }}
              isAdmin={true}  // Enable admin functionality
              isUser={true}   // Enable user functionality 
              mapRef={externalMapRef || mapRef}
              onCloseSidebar={() => setSidebarOpen(false)} // Add close function
            />
          </Paper>
        )}

        {/* Right Sidebar - HideToolTip */}
        {rightSidebarOpen && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '100%',
              width: 320,
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 4,
              borderRadius: '4px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.9)',
            }}
          >

            <HideToolTip />
          </Paper>
        )}

        {/* Capacity and Utilization Display */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            zIndex: 1000,
            fontSize: '14px',
            flexDirection: 'row'
          }}
        >
          <Typography variant="caption" color="gray">
            Capacity:
          </Typography>
          <Typography variant="h4" color="black">
            {stats.totalGbps} Gbps
          </Typography>

          <Typography variant="caption" color="gray">
            Average Utilization:
          </Typography>
          <Typography variant="h4" color="black">
            {ipopUtilization}
            {/* {parseFloat(ipopDifference) !== 0 && (
              <Box
                sx={(theme) => {
                  const diff = parseFloat(ipopDifference);

                  return {
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    backgroundColor:
                      diff < 0
                        ? theme.colors.error.lighter
                        : theme.colors.success.lighter,
                    color:
                      diff < 0
                        ? theme.colors.error.main
                        : theme.colors.success.main
                  };
                }}
              >
                {ipopDifference}
              </Box>
            )} */}
          </Typography>
        </Box>
        <Box
          sx={{
            height: '100%',
            width: '100%'
          }}
        >
          <MapContainer
            style={{ height: '100%', width: '100%' }}
            ref={externalMapRef || mapRef}
          >
            <RemoveAttribution />
            <ChangeView center={[18, 134]} zoom={4} />
            <TileLayer
              url={`https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiConfig.mapApiKey}`}
            />

            {/* Static markers - memoized to prevent recreation */}
            <DynamicMarker position={[1.3678, 125.0788]} label="Kauditan, Indonesia" />
            <DynamicMarker position={[7.0439, 125.542]} label="Davao, Philippines" />
            <DynamicMarker position={[13.464717, 144.69305]} label="Piti, Guam" />
            <DynamicMarker position={[21.4671, 201.7798]} label="Makaha, Hawaii, USA" />
            <DynamicMarker position={[14.0679, 120.6262]} label="Nasugbu, Philippines" />
            <DynamicMarker position={[18.412883, 121.517283]} label="Ballesteros, Philippines" />

            {/* Country markers */}
            <USAMarker />
            <JapanMarker />
            <HongkongMarker />
            <SingaporeMarker />

            {/* C2C Cable - Rendered first to appear behind other cables */}
            <C2C />

            {/* Route position lists */}
            <RPLSeaUS1 />
            <RPLSeaUS2 />
            <RPLSeaUS3 />
            <RPLSeaUS4 />
            <RPLSeaUS5 />
            <RPLSeaUS6 />
            <RPLSJC1 />
            <RPLSJC3 />
            <RPLSJC4 />
            <RPLSJC5 />
            <RPLSJC6 />
            <RPLSJC7 />
            <RPLSJC8 />
            <RPLSJC9 />
            <RPLSJC10 />
            <RPLSJC11 />
            <RPLSJC12 />
            <RPLSJC13 />
            <RPLTGNIA1 />
            <RPLTGNIA2 />
            <RPLTGNIA3 />
            <RPLTGNIA4 />
            <RPLTGNIA5 />
            <RPLTGNIA6 />
            <RPLTGNIA7 />
            <RPLTGNIA8 />
            <RPLTGNIA9 />
            <RPLTGNIA10 />
            <RPLTGNIA11 />
            <RPLTGNIA12 />
            <SimulationButton />

            {selectedCable && selectedCutType && (
              <Marker
                key={`cable-${selectedCable.cut_id || `${selectedCable.latitude}-${selectedCable.longitude}`}`}
                position={[selectedCable.latitude, selectedCable.longitude]}
              >
                <Popup key={`popup-${selectedCable.cut_id || `${selectedCable.latitude}-${selectedCable.longitude}`}`}>
                  <Box sx={{ minWidth: 270, p: 1 }}>
                    <Box sx={{ background: '#B71C1C', color: 'white', p: 1, borderRadius: 1, mb: 1, textAlign: 'center' }}>
                      <Typography variant="h6">{selectedCutType.toUpperCase()}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', mb: 1 }}>
                      {selectedCable.distance} km — {selectedCable.cut_id}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      {formatDate(selectedCable.fault_date)} — Depth: {selectedCable.depth}m
                    </Typography>
                    <Typography sx={{ mb: 1 }}>Cut Type: {selectedCutType}</Typography>
                    <Typography sx={{ mb: 1 }}>Cable Type: {selectedCable.cable_type || 'Unknown'}</Typography>
                    <Typography sx={{ mb: 1 }}>Latitude: {selectedCable.latitude}</Typography>
                    <Typography sx={{ mb: 1 }}>Longitude: {selectedCable.longitude}</Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Delete button clicked for cable:', selectedCable.cut_id);

                          // Confirm deletion before proceeding
                          if (window.confirm(`Are you sure you want to delete cable ${selectedCable.cut_id}?`)) {
                            try {
                              await handleDeleteCable(selectedCable);
                            } catch (error) {
                              console.error('Error in delete button click:', error);
                            }
                          }
                        }}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          width: '100%',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Close button clicked');

                          // Close the popup using the callback function
                          if (onCloseCablePopup) {
                            onCloseCablePopup();
                          }
                        }}
                        style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          width: '100%',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                      >
                        Close
                      </button>
                    </Box>
                  </Box>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </Box>
      </Box>
    </CableMapErrorBoundary>
  );
};

export default CableMap;
