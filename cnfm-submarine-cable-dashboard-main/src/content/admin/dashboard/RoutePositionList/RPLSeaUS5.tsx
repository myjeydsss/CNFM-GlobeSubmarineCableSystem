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
  icon?: L.Icon;
  minZoom?: number;
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

  useEffect(() => {
    const handleZoomChange = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoom', handleZoomChange);
    return () => {
      map.off('zoom', handleZoomChange);
    };
  }, [map]);

  useEffect(() => {
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

function RPLSeaUS5() {
  const theme = useTheme();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [defineCableOpen, setDefineCableOpen] = useState(false);
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [isHovered, setIsHovered] = useState(false);

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
        const response = await fetch(`${apiBaseUrl}${port}/sea-us`);
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

          setStats({
            data: result,
            totalGbps,
            avgUtilization,
            zeroUtilizationCount: zeroCount
          });

          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [apiBaseUrl, port]);

  // Enhanced polyline and marker data fetching with debugging
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchPolylineData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/sea-us-rpl-s5`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          // Store the full segment data for hover popup
          setSegmentData(result);

          // More flexible coordinate parsing
          const mappedPositions = result
            .map((item: any, index: number) => {
              // Try different possible coordinate field names
              const lat = item.full_latitude ?? item.latitude ?? item.lat;
              const lng =
                item.full_longitude ?? item.longitude ?? item.lng ?? item.lon;

              // Convert strings to numbers if needed
              const parsedLat = typeof lat === 'string' ? parseFloat(lat) : lat;
              const parsedLng = typeof lng === 'string' ? parseFloat(lng) : lng;

              return {
                lat: parsedLat,
                lng: parsedLng,
                valid:
                  typeof parsedLat === 'number' &&
                  typeof parsedLng === 'number' &&
                  !isNaN(parsedLat) &&
                  !isNaN(parsedLng)
              };
            })
            .filter((item) => item.valid)
            .map((item) => [item.lat, item.lng] as [number, number]);

          setPositions(mappedPositions);

          // Process markers from the same data
          const markerData = result
            .filter((item: any) => {
              const hasEvent =
                item.event &&
                typeof item.event === 'string' &&
                (item.event.includes('BMH') ||
                  item.event.includes('S5R') ||
                  item.event.includes('BU'));

              return hasEvent;
            })
            .map((item: any) => {
              const lat = item.full_latitude ?? item.latitude ?? item.lat;
              const lng =
                item.full_longitude ?? item.longitude ?? item.lng ?? item.lon;

              return {
                latitude: typeof lat === 'string' ? parseFloat(lat) : lat,
                longitude: typeof lng === 'string' ? parseFloat(lng) : lng,
                label: item.event
              };
            })
            .filter(
              (marker) =>
                typeof marker.latitude === 'number' &&
                typeof marker.longitude === 'number' &&
                !isNaN(marker.latitude) &&
                !isNaN(marker.longitude)
            );

          setMarkers(markerData);

          clearInterval(interval);
        } else {
        }
      } catch (err) {
        console.error('Error fetching polyline data:', err);
      }
    };

    fetchPolylineData();
    interval = setInterval(fetchPolylineData, 2000);

    return () => clearInterval(interval);
  }, [apiBaseUrl, port]);

  const handleOpenDefine = () => setDefineCableOpen(true);
  const handleCloseDefine = () => setDefineCableOpen(false);

  // Helper to create a small SVG triangle DivIcon for 'BU' markers
  const createTriangleIcon = (color = 'gray') => {
    const size = 16;
    // move the triangle a few pixels down so it sits slightly below the geo-coordinate
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="transform: translateY(6px); display: block;">
        <polygon points="${size / 2},0 ${size},${size} 0,${size}" fill="${color}" stroke="black" stroke-width="1" />
      </svg>
    `;

    return L.divIcon({
      html: svg,
      className: 'triangle-marker',
      iconSize: [size, size],
      iconAnchor: [Math.round(size / 2), size]
    });
  };

  // Define polyline path options based on hover state
  const getPathOptions = () => {
    const baseColor = stats.avgUtilization > 0 ? 'green' : 'red';

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
      <CableCutMarkers cableSegment="seaus5" />
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
              .bindTooltip('SEA-US Segment 5', {
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

      {/* Dynamic Markers */}
      {markers.map((marker, index) => {
        const isBU = typeof marker.label === 'string' && marker.label.includes('BU');
        const icon = isBU ? createTriangleIcon('orange') : undefined;

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
          <Typography variant="h5">SEA-US Submarine Cable Details</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <CardContent>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Ready For Service
              </Typography>
              <Typography variant="body1" color="primary" paragraph>
                2017 August
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Cable Length
              </Typography>
              <Typography variant="body1" paragraph>
                14,500 km
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Owners
              </Typography>
              <Typography variant="body1" paragraph>
                GTA TeleGuam, Globe Telecom, Hawaiian Telcom, Lightstorm
                Telecom, Telin
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Suppliers
              </Typography>
              <Typography variant="body1" color="primary" paragraph>
                NEC
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Landing Points
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" color="primary">
                  Piti, Guam
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Kauditan, Indonesia
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Magachgil, Yap, Micronesia
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Ngeremlengui, Palau
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Davao, Philippines
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Hermosa Beach, CA, United States
                </Typography>
                <Typography component="li" variant="body1" color="primary">
                  Makaha, Hawaii, United States
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

export default RPLSeaUS5;
