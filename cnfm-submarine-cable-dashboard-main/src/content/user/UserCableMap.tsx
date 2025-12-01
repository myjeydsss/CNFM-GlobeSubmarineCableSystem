import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense
} from 'react';
import L from 'leaflet';
import React from 'react';
// TanStack Query hooks
import {
  useDataSummary,
  useIpopUtilization,
  useLastUpdate,
  useDeleteCable,
  usePrefetchData
} from '../../hooks/useApi';

// Lazy load heavy components for better performance
const DeletedCablesSidebar = lazy(
  () => import('../admin/components/DeletedCablesSidebar')
);
const HideToolTipForGuest = lazy(
  () => import('../admin/components/HideToolTipForGuest')
);

// Lazy load markers
const USAMarker = lazy(() => import('../admin/components/USAMarker'));
const JapanMarker = lazy(() => import('../admin/components/JapanMarker'));
const HongkongMarker = lazy(() => import('../admin/components/HongkongMarker'));
const SingaporeMarker = lazy(
  () => import('../admin/components/SingaporeMarker')
);

// Lazy load route components - grouped by system for better code splitting
const SeaUSRoutes = lazy(() =>
  Promise.all([
    import('../admin/dashboard/RoutePositionList/RPLSeaUS1'),
    import('../admin/dashboard/RoutePositionList/RPLSeaUS2'),
    import('../admin/dashboard/RoutePositionList/RPLSeaUS3'),
    import('../admin/dashboard/RoutePositionList/RPLSeaUS4'),
    import('../admin/dashboard/RoutePositionList/RPLSeaUS5'),
    import('../admin/dashboard/RoutePositionList/RPLSeaUS6')
  ]).then((modules) => ({
    default: () => (
      <>
        {modules.map((Module, index) => (
          <Module.default key={`seaus-${index}`} />
        ))}
      </>
    )
  }))
);

const SJCRoutes = lazy(() =>
  Promise.all([
    import('../admin/dashboard/RoutePositionList/RPLSJC1'),
    import('../admin/dashboard/RoutePositionList/RPLSJC3'),
    import('../admin/dashboard/RoutePositionList/RPLSJC4'),
    import('../admin/dashboard/RoutePositionList/RPLSJC5'),
    import('../admin/dashboard/RoutePositionList/RPLSJC6'),
    import('../admin/dashboard/RoutePositionList/RPLSJC7'),
    import('../admin/dashboard/RoutePositionList/RPLSJC8'),
    import('../admin/dashboard/RoutePositionList/RPLSJC9'),
    import('../admin/dashboard/RoutePositionList/RPLSJC10'),
    import('../admin/dashboard/RoutePositionList/RPLSJC11'),
    import('../admin/dashboard/RoutePositionList/RPLSJC12'),
    import('../admin/dashboard/RoutePositionList/RPLSJC13')
  ]).then((modules) => ({
    default: () => (
      <>
        {modules.map((Module, index) => (
          <Module.default key={`sjc-${index}`} />
        ))}
      </>
    )
  }))
);

const TGNIARoutes = lazy(() =>
  Promise.all([
    import('../admin/dashboard/RoutePositionList/RPLTGNIA1'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA2'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA3'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA4'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA5'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA6'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA7'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA8'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA9'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA10'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA11'),
    import('../admin/dashboard/RoutePositionList/RPLTGNIA12')
  ]).then((modules) => ({
    default: () => (
      <>
        {modules.map((Module, index) => (
          <Module.default key={`tgnia-${index}`} />
        ))}
      </>
    )
  }))
);

const C2C = lazy(() => import('../admin/dashboard/C2C'));

// Loading component for better UX during component loading
const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Loading...'
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 2,
      minHeight: '60px'
    }}
  >
    <Box
      sx={{
        width: '20px',
        height: '20px',
        border: '2px solid #f3f3f3',
        borderTop: '2px solid #3854A5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        mr: 2,
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }}
    />
    <Typography variant="body2" color="textSecondary">
      {message}
    </Typography>
  </Box>
);

// Define types for better type safety
type CableData = {
  cut_id?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  depth?: number;
  fault_date?: string;
  cut_type?: string;
  cable_type?: string;
  simulated?: string;
  gbps?: number;
  percent?: number;
  [key: string]: any; // for other properties
};

type ChangeViewProps = {
  center: [number, number];
  zoom: number;
};

type SummaryItem = {
  gbps?: number;
  percent?: number;
};

const formatGbps = (value?: number) =>
  Number.isFinite(value) ? Number(value).toLocaleString() : '0';

const formatPercent = (value?: number) =>
  Number.isFinite(value) ? `${Number(value).toFixed(2)}%` : '0%';

// Memoized ChangeView component for better performance
const ChangeView = React.memo<ChangeViewProps>(({ center, zoom }) => {
  const map = useMap();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only set the view once on initial load, don't override user interactions
    // This prevents the zoom-out bug when users manually zoom in and move the map
    if (!hasInitializedRef.current && map) {
      map.setView(center, zoom);
      hasInitializedRef.current = true;
    }
  }, [map, center, zoom]);

  return null;
});

ChangeView.displayName = 'ChangeView';

type DynamicMarkerProps = {
  position: [number, number];
  label: string;
  icon?: L.Icon;
};

// Memoized DynamicMarker component for better performance
const DynamicMarker = React.memo<DynamicMarkerProps>(
  ({ position, label, icon }) => {
    const map = useMap();

    useEffect(() => {
      if (!position || !map) return;

      // Create pane only if it doesn't exist to prevent memory leaks
      const paneName = 'markerPane';
      if (!map.getPane(paneName)) {
        map.createPane(paneName);
        const pane = map.getPane(paneName);
        if (pane) pane.style.zIndex = '650';
      }

      let marker: L.Marker | L.CircleMarker;

      if (icon) {
        marker = L.marker(position, {
          icon,
          pane: paneName
        });
      } else {
        marker = L.circleMarker(position, {
          radius: 4,
          color: 'gray',
          fillColor: 'white',
          fillOpacity: 1,
          pane: paneName
        });
      }

      marker.bindTooltip(
        `<span style="font-size: 14px; font-weight: bold;">${label}</span>`,
        {
          direction: 'top',
          offset: icon ? [0, -30] : [0, -10],
          permanent: false,
          opacity: 1
        }
      );

      marker.addTo(map);

      return () => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      };
    }, [position, map, label, icon]);

    return null;
  }
);

DynamicMarker.displayName = 'DynamicMarker';

// Custom popup component removed - functionality now handled by DeletedCablesSidebar

// Memoized component to remove attribution
const RemoveAttribution = React.memo(() => {
  const map = useMap();

  useEffect(() => {
    // Remove attribution control when component mounts
    if (map?.attributionControl) {
      map.attributionControl.remove();
    }
  }, [map]);

  return null;
});

RemoveAttribution.displayName = 'RemoveAttribution';

// Error boundary wrapper component - Memoized for better performance
const UserCableMapErrorBoundary = React.memo<{ children: React.ReactNode }>(
  ({ children }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        console.error('UserCableMap Error:', error);
        setHasError(true);
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
      return (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: '#f5f5f5',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Map Loading Error
          </Typography>
          <Typography variant="body2" color="textSecondary">
            There was an error loading the cable map. Please refresh the page or
            contact support.
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
  }
);

UserCableMapErrorBoundary.displayName = 'UserCableMapErrorBoundary';

interface UserCableMapProps {
  selectedCable?: CableData;
  selectedCutType?: string | null;
  mapRef?: React.RefObject<L.Map>;
  onCloseCablePopup?: () => void;
}

// Memoized and optimized UserCableMap component for faster rendering
const UserCableMap = React.memo<UserCableMapProps>(
  ({
    selectedCable,
    selectedCutType,
    mapRef: externalMapRef,
    onCloseCablePopup
  }) => {
    // State declarations - using lazy initial state for better performance
    const [mapHeight, setMapHeight] = useState('100vh');
    const [ipopUtilization, setIpopUtilization] = useState('0%');
    const [ipopDifference, setIpopDifference] = useState('0%');
    const [stats, setStats] = useState(() => ({
      data: [] as SummaryItem[],
      totalGbps: 0,
      avgUtilization: 0,
      zeroUtilizationCount: 0
    }));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const mapCenter = useMemo(() => [18, 134] as L.LatLngExpression, []);
    const mapZoom = 4;
    const mapContainerProps = useMemo(
      () => ({ center: mapCenter, zoom: mapZoom }),
      [mapCenter]
    );

    // Enhanced notification system for deleted cable information
    const [notification, setNotification] = useState(() => ({
      open: false,
      message: '',
      severity: 'info' as 'success' | 'error' | 'warning' | 'info'
    }));

    // Refs
    const mapRef = useRef<L.Map | null>(null);
    const styleElementRef = useRef<HTMLStyleElement | null>(null);
    const dataFetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const ipopFetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const zoomStyleRef = useRef<HTMLStyleElement | null>(null);

    // Determine if an administrator is logged in so we can enable admin-only UI
    const isAdminLoggedIn = useMemo(() => {
      try {
        const loggedIn = localStorage.getItem('loggedIn') === 'true';
        const role = localStorage.getItem('user_role');
        return !!loggedIn && !!role && role.toLowerCase() === 'administrator';
      } catch (err) {
        return false;
      }
    }, []);

    // TanStack Query hooks for shared data and mutations
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
      data: lastUpdateQuery,
      isLoading: isLastUpdateLoading,
      error: lastUpdateError,
      refetch: refetchLastUpdate
    } = useLastUpdate();

    // Mutation for deleting cables (available if needed)
    const deleteCableMutation = useDeleteCable();

    // Prefetch helpers
    const { prefetchDataSummary, prefetchIpopUtilization } = usePrefetchData();

    // Environment variables - memoized to prevent unnecessary re-renders
    const apiConfig = useMemo(
      () => ({
        apiBaseUrl: process.env.REACT_APP_API_BASE_URL || '',
        port: process.env.REACT_APP_PORT || '',
        mapApiKey: process.env.REACT_APP_GEOAPIFY_API_KEY || ''
      }),
      []
    );

    const tileUrl = useMemo(() => {
      if (apiConfig.mapApiKey) {
        return `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiConfig.mapApiKey}`;
      }
      // Fallback to OSM if api key is missing/unset
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }, [apiConfig]);

    // Optimized map height calculation (matches admin dashboard exactly)
    const updateMapHeight = useCallback(() => {
      setMapHeight('100vh');
    }, []);

    // Enhanced notification helper
    const showNotification = useCallback(
      (
        message: string,
        severity: 'success' | 'error' | 'warning' | 'info' = 'info'
      ) => {
        setNotification({ open: true, message, severity });
      },
      []
    );

    const hideNotification = useCallback(() => {
      setNotification((prev) => ({ ...prev, open: false }));
    }, []);

    // Cable selection now handled entirely by DeletedCablesSidebar - custom popup removed
    const handleCableSelection = useCallback(
      (cable: CableData) => {
        if (!cable || !cable.latitude || !cable.longitude) return;

        // Use external mapRef if provided, otherwise use internal mapRef
        const map = externalMapRef?.current || mapRef.current;
        if (!map) return;

        // Stop any ongoing animations before starting new one
        map.stop();

        // Cable selection is now handled by DeletedCablesSidebar
        // No custom popup state management needed

        // Calculate distance-based animation timing for optimal UX
        const currentCenter = map.getCenter();
        const targetLat = parseFloat(
          parseFloat(cable.latitude.toString()).toFixed(6)
        );
        const targetLng = parseFloat(
          parseFloat(cable.longitude.toString()).toFixed(6)
        );
        const distance = currentCenter.distanceTo(
          L.latLng(targetLat, targetLng)
        );

        // Determine optimal animation duration based on distance
        let animationDuration: number;
        if (distance > 2000000) animationDuration = 1.2; // Very long distance
        else if (distance > 500000) animationDuration = 0.9; // Long distance
        else if (distance > 100000) animationDuration = 0.7; // Medium distance
        else if (distance > 10000) animationDuration = 0.5; // Short distance
        else animationDuration = 0.3; // Very short distance

        // Apply immediate smooth transition with offset positioning
        const mapContainer = map.getContainer();
        const mapHeight = mapContainer.clientHeight;

        // Calculate offset to position marker slightly below center of viewport
        const targetPoint = map.project([cable.latitude, cable.longitude], 14);

        // Reduced offset for more centered positioning
        const offsetY = mapHeight * 0.1; // Further reduced for better centering
        const adjustedPoint = L.point(targetPoint.x, targetPoint.y - offsetY);

        // Convert back to lat/lng
        const adjustedCenter = map.unproject(adjustedPoint, 14);

        map.setView([adjustedCenter.lat, adjustedCenter.lng], 14, {
          animate: true,
          duration: animationDuration, // Dynamic duration based on distance
          easeLinearity: 0.1 // Faster, smoother easing
        });
      },
      [externalMapRef]
    );

    // Optimized delete cable function with better error handling
    const handleDeleteCable = useCallback(
      async (cable: CableData) => {
        if (!cable?.cut_id) {
          alert('Invalid cable data');
          return;
        }

        try {
          console.log(
            'Making delete request for cable (mutation):',
            cable.cut_id
          );

          const result = await deleteCableMutation.mutateAsync(cable.cut_id);
          console.log('Delete mutation response:', result);

          if (result && (result.success || result?.ok)) {
            // Update the lastUpdate to trigger refresh in sidebar if it exists
            setLastUpdate(Date.now().toString());
            alert('Cable deleted successfully!');
            // Close the popup by clearing selected cable
            if (onCloseCablePopup) {
              onCloseCablePopup();
            }
            // Ensure queries are refetched to update the UI
            refetchStats();
            refetchLastUpdate();
          } else {
            alert(
              'Failed to delete cable: ' + (result?.message || 'Unknown error')
            );
          }
        } catch (error) {
          console.error('Error deleting cable:', error);
          alert(
            'Error deleting cable: ' +
              (error instanceof Error ? error.message : 'Unknown error')
          );
        }
      },
      [
        apiConfig,
        setLastUpdate,
        onCloseCablePopup,
        deleteCableMutation,
        refetchStats,
        refetchLastUpdate
      ]
    );

    // Sync TanStack Query results into local state for display
    useEffect(() => {
      if (statsData) {
        // statsData shape matches our stats state
        setStats((prev) => ({ ...prev, ...statsData } as any));
      }
    }, [statsData]);

    useEffect(() => {
      if (ipopData) {
        setIpopUtilization(ipopData.utilization || '0%');
        setIpopDifference(ipopData.difference || '');
      }
    }, [ipopData]);

    useEffect(() => {
      if (lastUpdateQuery) {
        setLastUpdate(lastUpdateQuery);
      }
    }, [lastUpdateQuery]);

    // Prefetch data on mount for better performance
    useEffect(() => {
      prefetchDataSummary();
      prefetchIpopUtilization();
    }, [prefetchDataSummary, prefetchIpopUtilization]);

    // CSS for popup styling removed - functionality now handled by DeletedCablesSidebar
    useEffect(() => {
      return () => {
        if (
          styleElementRef.current &&
          document.head.contains(styleElementRef.current)
        ) {
          document.head.removeChild(styleElementRef.current);
          styleElementRef.current = null;
        }
      };
    }, []);

    // Automatic panning to selectedCable disabled to prevent conflicts with user map interactions
    // The DeletedCablesSidebar handles its own camera movements, so no automatic panning needed here
    // This prevents the zoom-out bug when users manually interact with the map

    // Simplified initial notifications - reduced for better performance
    useEffect(() => {
      let timer: NodeJS.Timeout;

      timer = setTimeout(() => {
        showNotification(
          '🌟 Enhanced User Cable Map: Click sidebar (☰) to navigate to deleted cables with smooth camera movement!',
          'info'
        );
      }, 3000); // Reduced to single notification after 3 seconds

      return () => {
        clearTimeout(timer);
      };
    }, [showNotification]);

    // Optimized data fetching with caching and abort controller
    const fetchDataSummary = useCallback(
      async (abortController?: AbortController) => {
        try {
          // Add cache headers for better performance
          const response = await fetch(
            `${apiConfig.apiBaseUrl}${apiConfig.port}/data-summary`,
            {
              signal: abortController?.signal,
              headers: {
                'Cache-Control': 'max-age=30', // Cache for 30 seconds
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) throw new Error('Failed to fetch data summary');

          const result = await response.json();

          if (!mountedRef.current) return false;

          if (Array.isArray(result) && result.length > 0) {
            // Batch state updates for better performance
            const totalGbps = result.reduce(
              (sum, item) => sum + (item.gbps || 0),
              0
            );
            const totalUtilization = result.reduce(
              (sum, item) => sum + (item.percent || 0),
              0
            );
            const avgUtilization = parseFloat(
              (totalUtilization / result.length).toFixed(2)
            );
            const zeroCount = result.filter(
              (item) => item.percent === 0
            ).length;

            // Single state update instead of multiple
            setStats((prevStats) => ({
              ...prevStats,
              data: result,
              totalGbps,
              avgUtilization,
              zeroUtilizationCount: zeroCount
            }));
            return true; // Success
          } else {
            console.log('No data received, will retry...');
            return false; // No data
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return false;
          console.error('Error fetching data:', err);
          return false;
        }
      },
      [apiConfig, mountedRef]
    );

    // Optimized IPOP utilization fetching with caching
    const fetchIpopUtilization = useCallback(
      async (abortController?: AbortController) => {
        try {
          const response = await fetch(
            `${apiConfig.apiBaseUrl}${apiConfig.port}/average-util`,
            {
              headers: {
                'Cache-Control': 'max-age=30', // Cache for 30 seconds
                'Content-Type': 'application/json'
              },
              signal: abortController?.signal
            }
          );

          if (!response.ok) throw new Error('Failed to fetch IPOP utilization');

          const data = await response.json();

          if (!mountedRef.current) return false;

          if (data?.current?.length) {
            const currentVal = parseFloat(data.current[0].a_side);
            // Batch state updates
            setIpopUtilization(`${currentVal}%`);

            if (data?.previous?.length) {
              const previousVal = parseFloat(data.previous[0].a_side);
              const diff = currentVal - previousVal;
              const sign = diff > 0 ? '+' : '';
              setIpopDifference(`${sign}${diff.toFixed(2)}%`);
            } else {
              setIpopDifference('');
            }
            return true;
          } else {
            setIpopUtilization('0%');
            setIpopDifference('');
            return false;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError')
            return false;
          console.error('Error fetching IPOP utilization:', error);
          return false;
        }
      },
      [apiConfig, mountedRef]
    );

    // Map height update with debounced resize handler
    useEffect(() => {
      let timeoutId: NodeJS.Timeout;

      const debouncedUpdateMapHeight = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateMapHeight, 100);
      };

      updateMapHeight(); // Initial call
      window.addEventListener('resize', debouncedUpdateMapHeight);

      return () => {
        window.removeEventListener('resize', debouncedUpdateMapHeight);
        clearTimeout(timeoutId);
      };
    }, [updateMapHeight]);

    // Optimized data fetching effect with reduced frequency for better performance
    useEffect(() => {
      let retryCount = 0;
      const maxRetries = 3; // Reduced retries

      const startDataFetching = async () => {
        const abortController = new AbortController();

        const fetchData = async () => {
          const success = await fetchDataSummary(abortController);
          if (success) {
            retryCount = 0; // Reset retry count on success
            if (dataFetchIntervalRef.current) {
              clearInterval(dataFetchIntervalRef.current);
              dataFetchIntervalRef.current = null;
            }
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying data fetch (${retryCount}/${maxRetries})...`);
          }
        };

        // Initial fetch
        await fetchData();

        // Set up interval only if we haven't succeeded yet - increased interval for better performance
        if (retryCount > 0 && retryCount < maxRetries) {
          dataFetchIntervalRef.current = setInterval(fetchData, 5000); // Increased to 5 seconds
        }

        return abortController;
      };

      const abortController = startDataFetching();

      return () => {
        if (dataFetchIntervalRef.current) {
          clearInterval(dataFetchIntervalRef.current);
          dataFetchIntervalRef.current = null;
        }
        abortController.then((controller) => controller.abort());
      };
    }, [fetchDataSummary]);

    // Optimized IPOP utilization fetching effect with reduced frequency
    useEffect(() => {
      let retryCount = 0;
      const maxRetries = 3; // Reduced retries

      const startIpopFetching = async () => {
        const abortController = new AbortController();

        const fetchIpop = async () => {
          const success = await fetchIpopUtilization(abortController);
          if (success) {
            retryCount = 0;
            if (ipopFetchIntervalRef.current) {
              clearInterval(ipopFetchIntervalRef.current);
              ipopFetchIntervalRef.current = null;
            }
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying IPOP fetch (${retryCount}/${maxRetries})...`);
          }
        };

        await fetchIpop();

        // Increased interval for better performance
        if (retryCount > 0 && retryCount < maxRetries) {
          ipopFetchIntervalRef.current = setInterval(fetchIpop, 5000); // Increased to 5 seconds
        }

        return abortController;
      };

      const abortController = startIpopFetching();

      return () => {
        if (ipopFetchIntervalRef.current) {
          clearInterval(ipopFetchIntervalRef.current);
          ipopFetchIntervalRef.current = null;
        }
        abortController.then((controller) => controller.abort());
      };
    }, [fetchIpopUtilization]);

    // Component unmount cleanup
    useEffect(() => {
      return () => {
        mountedRef.current = false;
        if (dataFetchIntervalRef.current) {
          clearInterval(dataFetchIntervalRef.current);
        }
        if (ipopFetchIntervalRef.current) {
          clearInterval(ipopFetchIntervalRef.current);
        }
        if (
          zoomStyleRef.current &&
          document.head.contains(zoomStyleRef.current)
        ) {
          document.head.removeChild(zoomStyleRef.current);
          zoomStyleRef.current = null;
        }
      };
    }, []);

    // Inject custom styling for Leaflet zoom controls (blurred/translucent pill)
    useEffect(() => {
      const styleTag = document.createElement('style');
      styleTag.id = 'leaflet-zoom-custom-styles';
      styleTag.innerHTML = `
      .leaflet-control-container .leaflet-top {
        top: auto !important;
        bottom: 16px !important;
      }
      .leaflet-control-container .leaflet-left {
        left: 16px !important;
      }
      .leaflet-control-container .leaflet-bottom {
        bottom: 16px !important;
      }
      .leaflet-control-zoom {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      .leaflet-control-zoom a {
        background: rgba(255,255,255,0.85) !important;
        color: #1d2a3d !important;
        border: 1px solid rgba(0,0,0,0.12) !important;
        box-shadow: 0 8px 16px rgba(0,0,0,0.28) !important;
        backdrop-filter: blur(10px);
        width: 36px;
        height: 36px;
        line-height: 36px;
        border-radius: 12px;
        font-weight: 800;
      }
      .leaflet-control-zoom a:hover {
        background: rgba(255,255,255,0.95) !important;
      }
      .leaflet-control-zoom a:active {
        transform: translateY(1px);
      }
      .leaflet-control-zoom a + a {
        margin-top: 4px;
      }
    `;
      document.head.appendChild(styleTag);
      zoomStyleRef.current = styleTag;
      return () => {
        if (
          zoomStyleRef.current &&
          document.head.contains(zoomStyleRef.current)
        ) {
          document.head.removeChild(zoomStyleRef.current);
          zoomStyleRef.current = null;
        }
      };
    }, []);

    // Sidebar cable selection - let DeletedCablesSidebar handle camera movement internally
    const handleSidebarCableSelect = useCallback((cable: CableData) => {
      // Let DeletedCablesSidebar handle all map positioning internally
      // Don't interfere with map panning to avoid conflicts
      console.log(
        'User Cable Map - Cable selected and positioned:',
        cable.cut_id
      );
    }, []);

    const handleSidebarToggle = useCallback(() => {
      setSidebarOpen((prev) => {
        const newState = !prev;
        if (newState) {
          showNotification(
            '🔧 DeletedCablesSidebar Activated: Click any deleted cable to automatically zoom and navigate to its exact location on the map!',
            'info'
          );
        } else {
          showNotification(
            '📋 DeletedCablesSidebar closed. Use the menu button (☰) to access deleted cable viewing and navigation features.',
            'info'
          );
        }
        return newState;
      });
    }, [showNotification]);

    const handleSidebarClose = useCallback(() => {
      setSidebarOpen(false);
    }, []);

    // Popup close handler removed - functionality now handled by DeletedCablesSidebar

    // Optimized formatDate function with memoization
    const formatDate = useCallback((dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }, []);

    // Marker style function removed - functionality now handled by DeletedCablesSidebar

    return (
      <UserCableMapErrorBoundary>
        <Box sx={{ position: 'relative', width: '100%', height: mapHeight }}>
          {/* Enhanced Toggle Button for Comprehensive Sidebar Functionality */}
          {/* Deleted Cable Sidebar Toggle Button - normal position when closed, below sidebar when open */}
          {!sidebarOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 1200,
                background: 'rgba(255,255,255,0.45)',
                borderRadius: '12px',
                boxShadow: '0 10px 22px rgba(0,0,0,0.28)',
                padding: '6px 10px',
                border: '1px solid rgba(255,255,255,0.55)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <IconButton
                sx={{
                  background: 'rgba(255,255,255,0.65)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                  borderRadius: '10px',
                  p: 1,
                  border: '1px solid rgba(255,255,255,0.6)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.78)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s ease'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
                onClick={handleSidebarToggle}
                aria-label="Access Comprehensive Deleted Cables Management"
              >
                <MenuIcon sx={{ fontSize: 28, color: '#1d2a3d' }} />
              </IconButton>
            </Box>
          )}
          {/* When sidebar is open, do not render the hamburger/toggle button inside the sidebar area */}

          {/* Right column: login, overview, and system details */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 1.25,
              zIndex: 1250
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{
                fontWeight: 700,
                width: 150,
                borderRadius: '999px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                textTransform: 'none',
                px: 3.5,
                py: 1.25,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                '&:hover': {
                  background: 'rgba(0,0,0,0.35)'
                }
              }}
              onClick={() => {
                window.location.href = '/login';
              }}
            >
              Log In
            </Button>

            <Box
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '12px 16px',
                borderRadius: '16px',
                minWidth: 220,
                boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF'
              }}
            >
              <Typography variant="caption" sx={{ color: '#e0e0e0' }}>
                Capacity
              </Typography>
              <Typography
                variant="h4"
                sx={{ lineHeight: 1.1, color: '#FFFFFF' }}
              >
                {stats.totalGbps} Gbps
              </Typography>

              <Typography variant="caption" sx={{ mt: 1, color: '#e0e0e0' }}>
                Average Utilization
              </Typography>
              <Typography
                variant="h4"
                sx={{ lineHeight: 1.1, color: '#FFFFFF' }}
              >
                {ipopUtilization}
              </Typography>
            </Box>

            <Box
              sx={{
                maxHeight: '70vh',
                width: '100',
                alignItems: 'flex-end'
              }}
            >
              <Suspense
                fallback={<LoadingSpinner message="Loading overview..." />}
              >
                <HideToolTipForGuest />
              </Suspense>
            </Box>
          </Box>

          {/* 
        ==========================================
        DELETEDCABLESSIDEBAR WITH ZOOM NAVIGATION
        ==========================================
        Enhanced sidebar integration with automatic camera movement:
        
        ✅ New Features Added:
        - Automatic zoom and pan to exact cable location when clicked in sidebar
        - Smooth camera animation with distance-based timing
        - Intelligent positioning with slight offset for better visibility  
        - Enhanced zoom level (15) for detailed cable inspection
        - User-friendly notifications and feedback
        
        ✅ User Benefits:
        - Click any deleted cable in sidebar to navigate to its exact location
        - Smooth, professional camera movements with optimal zoom
        - Distance-based animation duration for natural feeling
        - No manual searching or scrolling needed
        - Professional DeletedCablesSidebar interface with viewing features:
          * Automatic camera navigation to selected cables
          * Detailed cable information display
          * Enhanced error handling (read-only)
          * Material-UI notifications with navigation feedback
          * Responsive design with zoom functionality
          * Delete operations DISABLED for users (isAdmin={false})
        
        The enhanced sidebar now provides intelligent navigation while
        maintaining appropriate user permissions (no delete operations).
      */}
          {sidebarOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: 360,
                zIndex: 1100,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 12px 30px rgba(0,0,0,0.32)',
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.32)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.16)',
                p: 1.25,
                gap: 1
              }}
            >
              <Box
                sx={{
                  alignSelf: 'flex-start',
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(6px)'
                }}
              >
                Active Cable Faults
              </Box>
              <Suspense
                fallback={<LoadingSpinner message="Loading sidebar..." />}
              >
                <DeletedCablesSidebar
                  onSelectCable={(cable) => {
                    // Let DeletedCablesSidebar handle all map positioning internally
                    // Don't interfere with map panning to avoid conflicts
                    // console.log('Cable selected and positioned:', cable);
                  }}
                  lastUpdate={lastUpdate || undefined}
                  setLastUpdate={(val: string) => {
                    // update local lastUpdate state and refetch query to keep UI in sync
                    setLastUpdate(val);
                    refetchLastUpdate();
                  }}
                  isAdmin={isAdminLoggedIn} // Enable admin functionality only for administrators
                  isUser={true} // Enable user functionality
                  mapRef={externalMapRef || mapRef}
                  onCloseSidebar={() => {
                    // Close the sidebar
                    setSidebarOpen(false);

                    // Reset map camera to original/default view if map is available
                    try {
                      const map =
                        (externalMapRef && externalMapRef.current) ||
                        mapRef.current;
                      if (map) {
                        // original center and zoom used by ChangeView
                        const defaultCenter: [number, number] = [18, 134];
                        const defaultZoom = 4;
                        if (typeof map.setView === 'function') {
                          map.setView(defaultCenter, defaultZoom, {
                            animate: true,
                            duration: 0.5
                          });
                        } else if (typeof map.setZoom === 'function') {
                          map.setView(defaultCenter, defaultZoom, {
                            animate: true,
                            duration: 0.5
                          });
                        }
                      }
                    } catch (err) {
                      /* swallow errors to avoid breaking UI on close */
                      // console.error('Error resetting map view on sidebar close:', err);
                    }
                  }} // Add close function that also recenters the map
                />
              </Suspense>
            </Box>
          )}

          <Box
            sx={{
              height: '100%',
              width: '100%'
            }}
          >
            {/* Tiled watermark overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 900,
                pointerEvents: 'none',
                opacity: 0.25,
                backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="260" viewBox="0 0 360 260"><g transform="translate(180 130) rotate(-20) translate(-180 -130)"><text x="180" y="140" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="rgba(255,255,255,0.82)" stroke="rgba(0,0,0,0.3)" stroke-width="0.6">Globe Submarine Cable System</text></g></svg>'
                )}")`,
                backgroundRepeat: 'repeat',
                backgroundSize:
                  'clamp(240px, 22vw, 360px) clamp(180px, 16vw, 260px)'
              }}
            />

            <MapContainer
              style={{ height: '100%', width: '100%' }}
              ref={externalMapRef || mapRef}
              {...(mapContainerProps as any)} // typing workaround: MapContainerProps should include center/zoom
            >
              <RemoveAttribution />
              <ChangeView center={[18, 134]} zoom={4} />
              <TileLayer url={tileUrl} />

              {/* Dynamic Markers */}
              <DynamicMarker
                position={[1.3678, 125.0788]}
                label="Kauditan, Indonesia"
              />
              <DynamicMarker
                position={[7.0439, 125.542]}
                label="Davao, Philippines"
              />
              <DynamicMarker
                position={[13.464717, 144.69305]}
                label="Piti, Guam"
              />
              <DynamicMarker
                position={[21.4671, 201.7798]}
                label="Makaha, Hawaii, USA"
              />
              <DynamicMarker
                position={[14.0679, 120.6262]}
                label="Nasugbu, Philippines"
              />
              <DynamicMarker
                position={[18.412883, 121.517283]}
                label="Ballesteros, Philippines"
              />

              {/* Location Markers - Lazy loaded for better performance */}
              <Suspense fallback={null}>
                <USAMarker />
                <JapanMarker />
                <HongkongMarker />
                <SingaporeMarker />
              </Suspense>

              {/* C2C Cable - Rendered first to appear behind other cables */}
              <Suspense fallback={null}>
                <C2C />
              </Suspense>

              {/* Route Components - Lazy loaded and grouped by system for optimal performance */}
              <Suspense fallback={null}>
                <SeaUSRoutes />
              </Suspense>

              <Suspense fallback={null}>
                <SJCRoutes />
              </Suspense>

              <Suspense fallback={null}>
                <TGNIARoutes />
              </Suspense>

              {/* Custom deleted cable popup removed - functionality now handled by DeletedCablesSidebar */}

              {/* Enhanced Cable Cut Popup - Full Admin Functionality */}
              {selectedCable && selectedCutType && (
                <Marker
                  key={`cable-${
                    selectedCable.cut_id ||
                    `${selectedCable.latitude}-${selectedCable.longitude}`
                  }`}
                  position={[selectedCable.latitude, selectedCable.longitude]}
                >
                  <Popup
                    key={`popup-${
                      selectedCable.cut_id ||
                      `${selectedCable.latitude}-${selectedCable.longitude}`
                    }`}
                  >
                    <Box sx={{ minWidth: 270, p: 1 }}>
                      <Box
                        sx={{
                          background: '#B71C1C',
                          color: 'white',
                          p: 1,
                          borderRadius: 1,
                          mb: 1,
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h6">
                          {selectedCutType.toUpperCase()}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{ fontWeight: 700, fontSize: '18px', mb: 1 }}
                      >
                        {selectedCable.distance} km — {selectedCable.cut_id}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        {formatDate(selectedCable.fault_date)} — Depth:{' '}
                        {selectedCable.depth}m
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        Cut Type: {selectedCutType}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        Cable Type: {selectedCable.cable_type || 'Unknown'}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        Latitude: {selectedCable.latitude}
                      </Typography>
                      <Typography sx={{ mb: 1 }}>
                        Longitude: {selectedCable.longitude}
                      </Typography>
                      <Box
                        sx={{
                          mt: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
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
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = '#5a6268')
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = '#6c757d')
                          }
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

          {/* Enhanced Notification System with DeletedCablesSidebar Integration Feedback */}
          <Snackbar
            open={notification.open}
            autoHideDuration={7000} // Increased duration for more detailed messages
            onClose={hideNotification}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ zIndex: 1300 }}
          >
            <Alert
              onClose={hideNotification}
              severity={notification.severity}
              sx={{
                width: '100%',
                minWidth: '320px', // Ensure adequate width for detailed messages
                fontSize: '14px',
                '& .MuiAlert-icon': {
                  fontSize: '22px' // Slightly larger icons for better visibility
                },
                '& .MuiAlert-message': {
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </UserCableMapErrorBoundary>
    );
  }
);

UserCableMap.displayName = 'UserCableMap';

export default UserCableMap;
