import { SyntheticEvent, useEffect, useState } from 'react';
import {
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  CardContent
} from '@mui/material';
import { Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import SJCSingapore from '../charts/SJC/SJCSingapore';
import SJCHongkong from '../charts/SJC/SJCHongkong';
import SJCJapan from '../charts/SJC/SJCJapan';

function DynamicMarker({ position, label, count, onClick }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.createPane('markerPane');
      map.getPane('markerPane').style.zIndex = 650;

      const marker = L.circleMarker(position, {
        radius: 4,
        color: 'transparent',
        fillColor: 'transparent',
        fillOpacity: 0,
        opacity: 0,
        pane: 'markerPane'
      }).addTo(map);

      // Create tooltip with badge in top-right corner
      marker.bindTooltip(
        `<div style="
    position: relative;
    display: inline-block;
    font-size: 12px;
    cursor: pointer;
  ">
    ${label}
    ${
      count > 0
        ? `<div style="
        position: absolute;
        top: -18px;
        right: -17px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 22px;
        height: 22px;
        background-color: red;
        color: white;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
      ">${count}</div>`
        : ''
    }
  </div>`,
        {
          direction: 'top',
          offset: [0, -5],
          opacity: 1,
          permanent: true,
          interactive: true,
          className: 'transparent-tooltip'
        }
      );

      marker.on('click', () => {
        if (onClick) onClick();
      });

      return () => {
        map.removeLayer(marker);
      };
    }
  }, [position, map, label, count, onClick]);

  return null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

interface SJCCable {
  site: string;
  cable: string;
  globe_circuit_id: string;
  link: string;
  gbps_capacity: number;
  percent_utilization: number;
  remarks: string;
}

function SJC() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;

  // ✅ Combine all related state values into one object
  const [stats, setStats] = useState({
    data: [],
    totalGbps: 0,
    avgUtilization: 0,
    zeroUtilizationCount: 0
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/sjc`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          const totalGbps = result.reduce(
            (sum, item) => sum + (item.gbps_capacity || 0),
            0
          );

          const totalUtilization = result.reduce(
            (sum, item) => sum + (item.percent_utilization || 0),
            0
          );

          const avgUtilization = parseFloat(
            (totalUtilization / result.length).toFixed(2)
          );

          const zeroCount = result.filter(
            (item) => item.percent_utilization === 0
          ).length;

          // ✅ Set all state values in a single update
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

  const zeroCount = stats.data.filter(
    (item) => item.percent_utilization === 0
  ).length;

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // SJC Cable System Route with Curved Path
  const positions = [
    [1.3214, 103.6513], // Tuas, Singapore
    [5.0, 107.0], // Intermediate point in the South China Sea
    [7.5, 111.0], // Curve approaching the Philippines
    [10.0, 115.0], // Curve approaching the Philippines
    [14.0665, 120.612], // Nasugbu, Philippines
    [17.082918, 117.520737], // West Philippine Sea mid-point
    [35.015, 139.9533] // Chikura, Japan
  ];

  // Hong Kong to Nasugbu Connection intersecting West Philippine Sea
  const hongKongToNasugbu = [
    [22.3193, 114.1694], // Hong Kong
    [17.082918, 117.520737], // West Philippine Sea intersection
    [14.0665, 120.612] // Nasugbu, Philippines
  ];

  // Handle Dialog Open/Close
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      {/*<Polyline
        positions={positions}
        pathOptions={{
          color: stats.avgUtilization > 0 ? 'blue' : 'red',
          weight: 4
        }}
        eventHandlers={{
          click: handleOpen // Open modal on click
        }}
      />
       Hong Kong to Ballesteros Route 
      <Polyline
        positions={hongKongToNasugbu}
        pathOptions={{
          color: stats.avgUtilization > 0 ? 'blue' : 'red',
          weight: 4
        }}
        eventHandlers={{
          click: handleOpen // Open modal on click
        }}
      />*/}
      <DynamicMarker
        position={[7.4465, 111.1488]}
        label={`Total Capacity: <strong>${stats.totalGbps} Gbps</strong><br>Average Utilization: <strong>${stats.avgUtilization}%</strong>`}
        count={zeroCount}
        onClick={handleOpen}
      />

      {/* Modal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h4">SJC Submarine Cable</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pb: 2 }}>
          <CardContent>
            <Box sx={{ width: '100%' }}>
              <Tabs
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                <Tab label="Singapore" {...a11yProps(0)} />
                <Tab label="Hong Kong" {...a11yProps(1)} />
                <Tab label="Japan" {...a11yProps(2)} />
              </Tabs>
              <TabPanel value={value} index={0}>
                <SJCSingapore />
              </TabPanel>
              <TabPanel value={value} index={1}>
                <SJCHongkong />
              </TabPanel>
              <TabPanel value={value} index={2}>
                <SJCJapan />
              </TabPanel>
            </Box>
          </CardContent>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SJC;
