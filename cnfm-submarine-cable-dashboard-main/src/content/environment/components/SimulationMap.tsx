import { Box, Typography, IconButton, Paper } from '@mui/material';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import L from 'leaflet';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';
import USAMarker from 'src/content/admin/components/USAMarker';
import JapanMarker from 'src/content/admin/components/JapanMarker';
import TGNIA from 'src/content/admin/dashboard/TGNIA';
import SJC from 'src/content/admin/dashboard/SJC';
import HongkongMarker from 'src/content/admin/components/HongkongMarker';
import SingaporeMarker from 'src/content/admin/components/SingaporeMarker';
import C2C from 'src/content/admin/dashboard/C2C';
import SeaUS from 'src/content/admin/dashboard/SeaUS';
import ReturnButton from './ReturnButton';
import CutSeaUS from './RPLSeaUS/CutSeaUS';
import RPLSeaUS1 from 'src/content/admin/dashboard/RoutePositionList/RPLSeaUS1';
import RPLSeaUS2 from 'src/content/admin/dashboard/RoutePositionList/RPLSeaUS2';
import RPLSeaUS3 from 'src/content/admin/dashboard/RoutePositionList/RPLSeaUS3';
import CutSJC from './RPLSJC/CutSJC';
import RPLSJC1 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC1';
import RPLSJC3 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC3';
import RPLSJC4 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC4';
import RPLSJC5 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC5';
import RPLSJC6 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC6';
import RPLSJC7 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC7';
import RPLSJC8 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC8';
import RPLSJC9 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC9';
import RPLSJC10 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC10';
import RPLSJC11 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC11';
import RPLSJC12 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC12';
import RPLSJC13 from 'src/content/admin/dashboard/RoutePositionList/RPLSJC13';
import CutTGNIA from './RPLTGNIA/CutTGNIA';
import RPLTGNIA1 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA1';
import RPLTGNIA2 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA2';
import RPLTGNIA3 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA3';
import RPLTGNIA4 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA4';
import RPLTGNIA5 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA5';
import RPLTGNIA6 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA6';
import RPLTGNIA7 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA7';
import RPLTGNIA8 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA8';
import RPLTGNIA9 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA9';
import RPLTGNIA10 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA10';
import RPLTGNIA11 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA11';
import RPLTGNIA12 from 'src/content/admin/dashboard/RoutePositionList/RPLTGNIA12';
import ResetButton from './ResetButton';
import RPLSeaUS4 from 'src/content/admin/dashboard/RoutePositionList/RPLSeaUS4';
import RPLSeaUS5 from 'src/content/admin/dashboard/RoutePositionList/RPLSeaUS5';
import RPLSeaUS6 from 'src/content/admin/dashboard/RoutePositionList/RPLSeaUS6';

// Lazy load the sidebar and tooltip components for better performance
const DeletedCablesSidebar = lazy(() => import('src/content/admin/components/DeletedCablesSidebar'));
const HideToolTip = lazy(() => import('src/content/admin/components/HideToolTip'));

// Loading component for better UX during component loading
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 2,
    bgcolor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 2,
    minHeight: '60px'
  }}>
    <Box sx={{
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
    }} />
    <Typography variant="body2">{message}</Typography>
  </Box>
);

// Define types for better type safety
interface CableCut {
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
}

interface SimulationMapProps {
  selectedCable?: CableCut | null;
  mapRef?: React.RefObject<L.Map>;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

type DynamicMarkerProps = {
  position: [number, number];
  label: string;
  icon?: L.Icon; // make it optional with the `?`
};

function DynamicMarker({ position, label, icon }: DynamicMarkerProps) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.createPane('markerPane');
      map.getPane('markerPane')!.style.zIndex = '650';

      let marker: L.Marker | L.CircleMarker;

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

      marker.bindTooltip(
        `<span style="font-size: 14px; font-weight: bold;">${label}</span>`,
        {
          direction: 'top',
          offset: icon ? [0, -30] : [0, -10], // 👈 Tooltip offset adjusted here
          permanent: false,
          opacity: 1
        }
      );

      marker.addTo(map);

      return () => {
        map.removeLayer(marker);
      };
    }
  }, [position, map, label, icon]);

  return null;
}

const SimulationMap: React.FC<SimulationMapProps> = ({ selectedCable, mapRef: externalMapRef }) => {
  const [mapHeight, setMapHeight] = useState('100%'); // Changed to 100% to fill container
  const [ipopUtilization, setIpopUtilization] = useState('0%');
  const [ipopDifference, setIpopDifference] = useState('0%');
  const [stats, setStats] = useState({
    data: [],
    totalGbps: 0,
    avgUtilization: 0,
    zeroUtilizationCount: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const mapApiKey = process.env.REACT_APP_GEOAPIFY_API_KEY;

  // Function to update height dynamically - now uses percentage
  const updateMapHeight = () => {
    // Since we're using a container with fixed height, use 100%
    setMapHeight('100%');
  };

  // Listen for window resize
  useEffect(() => {
    updateMapHeight(); // Set initial height
    window.addEventListener('resize', updateMapHeight);
    return () => window.removeEventListener('resize', updateMapHeight);
  }, []);
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/data-summary`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
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

          const zeroCount = result.filter((item) => item.percent === 0).length;

          setStats({
            data: result,
            totalGbps,
            avgUtilization,
            zeroUtilizationCount: zeroCount
          });

          // ✅ Stop interval after successful fetch
          clearInterval(interval);
        } else {
          console.log('No data received, retrying...');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    // Run immediately on mount
    fetchData();

    // Set up interval to retry every 2s if no data yet
    interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [apiBaseUrl, port]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchIpopUtil = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/average-util`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const data = await response.json();

        if (data?.current?.length) {
          const currentVal = parseFloat(data.current[0].a_side);
          setIpopUtilization(`${currentVal}%`);

          if (data?.previous?.length) {
            const previousVal = parseFloat(data.previous[0].a_side);
            const diff = currentVal - previousVal;
            const sign = diff > 0 ? '+' : '';
            setIpopDifference(`${sign}${diff.toFixed(2)}%`);
          } else {
            setIpopDifference('');
          }

          clearInterval(interval);
        } else {
          setIpopUtilization('0%');
          setIpopDifference('');
        }
      } catch (error) {
        console.error('Error fetching IPOP utilization:', error);
      }
    };

    // Run immediately on mount
    fetchIpopUtil();

    // Set up interval to retry every 2s if no data yet
    interval = setInterval(fetchIpopUtil, 2000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [apiBaseUrl, port]);

  // Custom component to remove attribution
  const RemoveAttribution = () => {
    const map = useMap();

    useEffect(() => {
      // Remove attribution control when component mounts
      map.attributionControl.remove();
    }, [map]);

    return null;
  };

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: '100%',
      borderRadius: '12px', // Add border radius to container
      overflow: 'hidden', // Ensure child elements respect the border radius
      // '& .leaflet-control-zoom': {
      //   display: 'none !important'
      // }
    }}>
      {/* Map Container */}
      <MapContainer
        style={{
          height: mapHeight,
          width: '100%',
          borderRadius: '12px' // Add border radius to map
        }}
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            if (externalMapRef) {
              (externalMapRef as any).current = map;
            }
          }
        }}
      >
        <ChangeView center={[18, 134]} zoom={4} />
        <RemoveAttribution />
        {/* Only set initial view on first mount, not on every render */}
        {/* <ChangeView center={[18, 134]} zoom={3.5} /> */}
        {/*<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />*/}
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${mapApiKey}`}
        />

        {/* Dynamic Hoverable Dot Markers*/}
        <DynamicMarker
          position={[1.3678, 125.0788]}
          label="Kauditan, Indonesia"
        />
        <DynamicMarker
          position={[7.0439, 125.542]}
          label="Davao, Philippines"
        />
        <DynamicMarker position={[13.464717, 144.69305]} label="Piti, Guam" />
        <DynamicMarker
          position={[21.4671, 201.7798]}
          label="Makaha, Hawaii, USA"
        />
        <USAMarker />
        <DynamicMarker
          position={[14.0679, 120.6262]}
          label="Nasugbu, Philippines"
        />
        <DynamicMarker
          position={[18.412883, 121.517283]}
          label="Ballesteros, Philippines"
        />
        <JapanMarker />
        <HongkongMarker />
        <SingaporeMarker />
        
        {/* C2C Cable - Rendered first to appear behind other cables */}
        <C2C />
        
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
        <ReturnButton />
        <CutSeaUS />
        <CutSJC />
        <CutTGNIA />
        <ResetButton />
      </MapContainer>


      {/* Show sidebar toggle button only when sidebar is closed */}
      {!sidebarOpen && (
        <Box
          sx={{
            position: 'absolute',
            left: 10,
            top: 78, // below the default zoom controls (which are top: 10px)
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <IconButton
            sx={{ background: '#fff', boxShadow: 2 }}
            onClick={() => {
              if (typeof (React as any).startTransition === 'function') {
                (React as any).startTransition(() => {
                  setSidebarOpen((open) => !open);
                });
              } else {
                setSidebarOpen((open) => !open);
              }
            }}
            aria-label="Show Deleted Cables Sidebar"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}


      {/* Right sidebar toggle button */}
      <IconButton
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1200, background: '#fff', boxShadow: 2 }}
        onClick={() => {
          // Use startTransition if available (React 18+), otherwise fallback
          if (typeof (React as any).startTransition === 'function') {
            (React as any).startTransition(() => {
              setRightSidebarOpen((open) => !open);
            });
          } else {
            setRightSidebarOpen((open) => !open);
          }
        }}
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
            lastUpdate={lastUpdate}
            setLastUpdate={setLastUpdate}
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
            borderRadius: '8px',
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
    </Box>
  );
};

export default SimulationMap;