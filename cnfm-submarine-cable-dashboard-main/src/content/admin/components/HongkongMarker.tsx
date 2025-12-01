import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  CardContent
} from '@mui/material';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  ArrowDownward,
  ArrowUpward,
  HorizontalRule
} from '@mui/icons-material';

type DynamicMarkerProps = {
  position: [number, number];
  label: string;
  icon?: L.Icon; // make it optional with the `?`
  onClick?: () => void; // optional click handler
};

function DynamicMarker({ position, label, icon, onClick }: DynamicMarkerProps) {
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

      marker.on('click', () => {
        if (onClick) onClick();
      });

      return () => {
        map.removeLayer(marker);
      };
    }
  }, [position, map, label, icon, onClick]);

  return null;
}

const hongKongFlagIcon = L.icon({
  iconUrl: '/static/images/overview/hongkong-flag-marker.png', // ✅ adjust path as needed
  iconSize: [36, 36], // ✅ size of the icon
  iconAnchor: [20, 36], // ✅ where to anchor the icon
  popupAnchor: [0, -32] // optional: for any popups
});

const COLORS = ['#3854A5', '#5590CC', '#57B0DD', '#C7D9EF', '#F1F4FA'];

const renderLabel = ({ name, value, percent }: any) => {
  return `${(percent * 100).toFixed(0)}%`;
};

const HongkongMarker = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [averageUtilization, setAverageUtilization] = useState(0);
  const [averageDifference, setAverageDifference] = useState(0);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;

  // Handle Dialog Open/Close
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    let interval: any;
    const fetchHongkongMarkerData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}${port}/hongkong-marker`);
        const json = await res.json();

        // Calculate total for center display
        const totalCapacity = json.reduce(
          (acc, item) => acc + parseFloat(item.value || 0),
          0
        );

        // Get the shared overall utilization
        const avgUtilizationOverall =
          json.length > 0 ? json[0].avgUtilizationOverall : 0;

        // Get the difference of the overall utilization and the previous one
        const prevAvgUtil = json.length > 0 ? json[0].prevAvgUtil : 0;
        const utilDifference = avgUtilizationOverall - prevAvgUtil;

        setData(json);
        setTotal(totalCapacity);
        setAverageUtilization(avgUtilizationOverall);
        setAverageDifference(Number(utilDifference.toFixed(2)));
      } catch (err) {
        console.error('Failed to fetch Hong Kong marker data:', err);
      }
    };
    // Initial fetch
    fetchHongkongMarkerData();
    // Always set interval to keep data fresh
    interval = setInterval(fetchHongkongMarkerData, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [apiBaseUrl, port]); // ✅ Runs only once on mount

  const CustomTooltip = ({ active, payload, total }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const { name, value, payload: itemPayload } = item;
      const utilization = itemPayload.avgUtilization?.toFixed(2) || 'N/A';

      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: 2,
            padding: 1.5,
            boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
            zIndex: 9999
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: itemPayload.fill || item.color
              }}
            />
            <Typography variant="body2" fontWeight="bold">
              {name}
            </Typography>
          </Box>

          <Box display="flex" gap={1}>
            <Typography variant="body2" sx={{ minWidth: 74 }}>
              Capacity:
            </Typography>
            <Typography variant="body2">{value} Gbps</Typography>
          </Box>

          <Box display="flex" gap={1}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>
              Utilization:
            </Typography>
            <Typography variant="body2">{utilization}%</Typography>
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <>
      <DynamicMarker
        position={[22.273265, 114.16892]}
        label="Hong Kong"
        icon={hongKongFlagIcon}
        onClick={handleOpen}
      />
      {/* Modal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ pb: 1 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Hong Kong Site
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Total Drop: {total} Gbps
              </Typography>

              {/* Donut Chart */}
              <Box sx={{ position: 'relative', width: 400, height: 370 }}>
                <PieChart width={400} height={370}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                    label={renderLabel}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{
                      zIndex: 9999, // bring tooltip above everything
                      borderRadius: 6,
                      color: '#333'
                    }}
                  />
                </PieChart>
                {/* Center Text */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Typography variant="h2" fontWeight="bold">
                    {averageUtilization}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Utilization
                  </Typography>
                </Box>
              </Box>

              {/* Data Comparison Section */}
              <Box mt={2} sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body1"
                  color={
                    averageDifference < 0
                      ? 'error.main'
                      : averageDifference > 0
                      ? 'success.main'
                      : 'text.primary'
                  }
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={0.5}
                >
                  {averageDifference < 0 ? (
                    <ArrowDownward fontSize="small" />
                  ) : averageDifference > 0 ? (
                    <ArrowUpward fontSize="small" />
                  ) : (
                    <HorizontalRule fontSize="small" /> // or any neutral icon
                  )}
                  {averageDifference === 0
                    ? 'No change in utilization'
                    : `${Math.abs(
                        averageDifference
                      )}% in utilization compared to last data`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on the average utilization of C2C, SJC, and TGNIA cable
                </Typography>
              </Box>
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
};

export default HongkongMarker;
