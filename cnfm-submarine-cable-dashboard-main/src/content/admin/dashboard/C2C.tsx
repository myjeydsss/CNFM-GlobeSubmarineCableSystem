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
import C2CSingapore from '../charts/C2C/C2CSingapore';
import C2CHongkong from '../charts/C2C/C2CHongkong';
import C2CJapan from '../charts/C2C/C2CJapan';
//import C2CSingapore from '../charts/C2C/C2CSingapore';
//import C2CHongkong from '../charts/C2C/C2CHongkong';
//import C2CJapan from '../charts/C2C/C2CJapan';

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
    ${count > 0
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

interface C2CCable {
  site: string;
  cable: string;
  globe_circuit_id: string;
  link: string;
  gbps_capacity: number;
  percent_utilization: number;
  remarks: string;
}

function C2C() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [defineCableOpen, setDefineCableOpen] = useState(false);
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
        const response = await fetch(`${apiBaseUrl}${port}/c2c`);
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

  // C2C Cable System Route (Singapore to Japan with curved path avoiding Taiwan)
  const positions = [
    [1.338, 103.6352], // Tuas, Singapore
    [5.0, 105.0], // Near Sumatra for a natural curve
    [7.5, 115.0], // South China Sea bend
    [14.0679, 120.6262], // Nasugbu, Philippines
    [17.0665, 115.312], // Nasugbu to Hong Kong Intersection
    [23.05, 122.25], // New point along the straight polyline, closer to (25.0, 124.7)
    [25.0, 124.7], // East China Sea (Curving East to avoid Taiwan)
    [30.0, 130.0], // Further curving North East
    [34.9706, 139.9615] // Chikura, Japan
  ];

  // Hong Kong to Nasugbu Connection intersecting West Philippine Sea
  const hongKongToNasugbu = [
    [22.2151, 114.2062], // Hong Kong
    [17.0665, 115.312], // West Philippine Sea intersection
    [14.0679, 120.6262] // Nasugbu, Philippines
  ];

  // Handle Dialog Open/Close
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleOpenDefine = () => setDefineCableOpen(true);
  const handleCloseDefine = () => setDefineCableOpen(false);

  return (
    <>
      {/* Clickable Polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: 'gray',
          weight: 4
        }}
        eventHandlers={{
          click: handleOpenDefine // Open modal on click
        }}
      />
      {/* Hong Kong to Nasugbu Route (Intersecting West Philippine Sea) */}
      <Polyline
        positions={hongKongToNasugbu}
        pathOptions={{
          color: 'gray',
          weight: 4
        }}
        eventHandlers={{
          click: handleOpenDefine // Open modal on click
        }}
      />

      {/* Modal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h4">C2C Submarine Cable</Typography>
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
                <C2CSingapore />
              </TabPanel>
              <TabPanel value={value} index={1}>
                <C2CHongkong />
              </TabPanel>
              <TabPanel value={value} index={2}>
                <C2CJapan />
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

      {/* Define Cable Modal Dialog */}
      <Dialog
        open={defineCableOpen}
        onClose={handleCloseDefine}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">C2C Submarine Cable Details</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <CardContent>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Ready For Service
              </Typography>
              <Typography variant="body1" color="primary" paragraph>
                2002 November
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Cable Length
              </Typography>
              <Typography variant="body1" paragraph>
                36,500 km
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Owners
              </Typography>
              <Typography variant="body1" paragraph>
                Telstra
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Suppliers
              </Typography>
              <Typography variant="body1" color="primary" paragraph>
                ASN, KDD-SCS, SubCom
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Landing Points
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" color="primary">
                  Chung Hom Kok, China
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Nanhui, China
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Qingdao, China
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Tseung Kwan O, China
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Ajigaura, Japan
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Chikura, Japan
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Shima, Japan
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Batangas, Philippines
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Cavite, Philippines
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Changi North, Singapore
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Changi South, Singapore
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Busan, South Korea
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Shindu-Ri, South Korea
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Fangshan, Taiwan
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Pa Li, Taiwan
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Tanshui, Taiwan
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDefine} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default C2C;
