import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  useTheme
} from '@mui/material';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import CableCutMarkers from 'src/content/environment/components/CableCutFetching';

type DynamicMarkerProps = {
  position: [number, number];
  label: string;
  icon?: L.Icon; // make it optional with the `?`
  minZoom?: number; // Add parameter for minimum zoom level
};

type MarkerData = {
  latitude: number;
  longitude: number;
  label: string;
};

function DynamicMarker({
  position,
  label,
  icon,
  minZoom = 5
}: DynamicMarkerProps) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState<number>(map.getZoom());

  // Set up event listener for zoom changes
  useEffect(() => {
    const handleZoomChange = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoom', handleZoomChange);
    return () => {
      map.off('zoom', handleZoomChange);
    };
  }, [map]);

  // Add/remove marker based on position and zoom level
  useEffect(() => {
    // Only add marker if position exists AND zoom level is at or above minZoom
    if (position && currentZoom >= minZoom) {
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
          offset: icon ? [0, -30] : [0, -10],
          permanent: false,
          opacity: 1
        }
      );

      marker.addTo(map);

      return () => {
        map.removeLayer(marker);
      };
    }
  }, [position, map, label, icon, currentZoom, minZoom]);

  return null;
}

function RPLSJC8() {
  const theme = useTheme();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [defineCableOpen, setDefineCableOpen] = useState(false);
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [isHovered, setIsHovered] = useState(false);

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

  // Fetch polyline and marker data
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchPolylineData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/sjc-rpl-s8`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          // Store the full segment data for hover popup
          setSegmentData(result);

          // Build positions for the polyline based on full_latitude and full_longitude
          const mappedPositions = result
            .filter(
              (item: any) =>
                typeof item.full_latitude === 'number' &&
                typeof item.full_longitude === 'number'
            )
            .map(
              (item: any) =>
                [item.full_latitude, item.full_longitude] as [number, number]
            );

          setPositions(mappedPositions);
          clearInterval(interval);
        } else {
          console.log('No polyline data received, retrying...');
        }
      } catch (err) {
        console.error('Error fetching polyline data:', err);
      }
    };

    // Fetch marker data
    const fetchMarkerData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/sjc-rpl-s8`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          // Process marker data - filter for events containing "S1R"
          const markerData = result
            .filter(
              (item: any) =>
                item.event &&
                typeof item.event === 'string' &&
                (item.event.includes('BMH') ||
                  item.event.includes('BU') ||
                  item.event.includes('S8O'))
            )
            .map((item: any) => ({
              latitude: item.full_latitude,
              longitude: item.full_longitude,
              label: item.event
            }));

          setMarkers(markerData);
        } else {
          console.log('No marker data received');
        }
      } catch (err) {
        console.error('Error fetching marker data:', err);
      }
    };

    // Fetch both types of data
    const fetchAllData = async () => {
      await fetchPolylineData();
      await fetchMarkerData();
    };

    fetchAllData();
    interval = setInterval(fetchPolylineData, 2000);

    return () => clearInterval(interval);
  }, [apiBaseUrl, port]);

  const handleOpenDefine = () => setDefineCableOpen(true);
  const handleCloseDefine = () => setDefineCableOpen(false);

  // Define polyline path options based on hover state
  const getPathOptions = () => {
    const baseColor = stats.avgUtilization > 0 ? 'blue' : 'red';

    if (isHovered) {
      return {
        color: baseColor,
        weight: 6,
        opacity: 1,
        // CSS box-shadow equivalent for SVG paths - creates glow effect
        className: 'glowing-polyline'
      };
    }

    return {
      color: baseColor,
      weight: 4,
      opacity: 0.8
    };
  };

  // Add CSS for glowing effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .glowing-polyline {
        filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor);
        transition: all 0.3s ease;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      <CableCutMarkers cableSegment="sjc8" />
      {/* Polyline Path with Hover Popup and Glowing Effect */}
      <Polyline
        positions={positions}
        pathOptions={getPathOptions()}
        eventHandlers={{
          click: handleOpenDefine, // Open modal on click
          mouseover: (e) => {
            const layer = e.target;
            const latlng = e.latlng;

            // Set hover state to trigger glow effect
            setIsHovered(true);

            // Create hover popup that follows cursor
            layer
              .bindTooltip('SJC Segment 8', {
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                className: 'custom-tooltip',
                opacity: 0.9,
                sticky: true // This makes the tooltip follow the cursor
              })
              .openTooltip(latlng);
          },
          mousemove: (e) => {
            const layer = e.target;
            const latlng = e.latlng;

            // Update tooltip position to follow cursor
            if (layer.getTooltip()) {
              layer.getTooltip().setLatLng(latlng);
            }
          },
          mouseout: (e) => {
            const layer = e.target;

            // Remove hover state to remove glow effect
            setIsHovered(false);

            layer.closeTooltip();
          }
        }}
      />

      {/* Dynamic Markers from API with minimum zoom of 5 */}
      {markers.map((marker, index) => {
        const isBU = typeof marker.label === 'string' && marker.label.includes('BU');
        const icon = isBU ? (function () {
          const size = 16;
          const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="transform: translateY(6px); display: block;">
              <polygon points="${size / 2},0 ${size},${size} 0,${size}" fill="orange" stroke="black" stroke-width="1" />
            </svg>
          `;

          return L.divIcon({ html: svg, className: 'triangle-marker', iconSize: [size, size], iconAnchor: [Math.round(size / 2), size] });
        })() : undefined;

        return (
          <DynamicMarker
            key={`marker-${index}`}
            position={[marker.latitude, marker.longitude] as [number, number]}
            label={marker.label}
            icon={icon}
            minZoom={8}
          />
        );
      })}
      {/* Define Cable Modal Dialog */}
      <Dialog
        open={defineCableOpen}
        onClose={handleCloseDefine}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">SJC Submarine Cable Details</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <CardContent>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Ready For Service
              </Typography>
              <Typography variant="body1" color="primary" paragraph>
                2013 June
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Cable Length
              </Typography>
              <Typography variant="body1" paragraph>
                8,900 km
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Owners
              </Typography>
              <Typography variant="body1" paragraph>
                China Mobile, China Telecom, Chunghwa Telecom, Globe Telecom,
                Google, KDDI, National Telecom, Singtel, Telkom Indonesia,
                Unified National Networks (UNN)
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Suppliers
              </Typography>
              <Typography variant="body1" color="primary" paragraph>
                NEC, SubCom
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Landing Points
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" color="primary">
                  Telisai, Brunei
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Chung Hom Kok, China
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Shantou, China
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Chikura, Japan
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Nasugbu, Philippines
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Tuas, Singapore
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

export default RPLSJC8;
