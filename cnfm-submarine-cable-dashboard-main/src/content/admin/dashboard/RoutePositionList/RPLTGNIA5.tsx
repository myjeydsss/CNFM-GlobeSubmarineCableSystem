import { useEffect, useState } from 'react';
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

function RPLTGNIA5() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [segmentLengthKm, setSegmentLengthKm] = useState<number | null>(null);
  const [segmentFirstEvent, setSegmentFirstEvent] = useState<string | null>(null);
  const [segmentLastEvent, setSegmentLastEvent] = useState<string | null>(null);
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
        const response = await fetch(`${apiBaseUrl}${port}/tgnia`);
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
        const response = await fetch(`${apiBaseUrl}${port}/tgnia-rpl-s5`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          const cumulativeValues = result
            .map((item: any) => item.cable_cumulative_total)
            .map((value: any) => (typeof value === 'string' ? parseFloat(value) : value))
            .filter((value: any) => typeof value === 'number' && !Number.isNaN(value));

          setSegmentLengthKm(
            cumulativeValues.length ? Math.max(...cumulativeValues) : null
          );
          const eventRows = result
            .map((item: any) => {
              const lat = item.full_latitude ?? item.latitude ?? item.lat;
              const lng = item.full_longitude ?? item.longitude ?? item.lng ?? item.lon;
              const parsedLat = typeof lat === 'string' ? parseFloat(lat) : lat;
              const parsedLng = typeof lng === 'string' ? parseFloat(lng) : lng;

              return {
                event: item.event,
                lat: parsedLat,
                lng: parsedLng
              };
            })
            .filter(
              (row: any) =>
                typeof row.lat === 'number' &&
                !Number.isNaN(row.lat) &&
                typeof row.lng === 'number' &&
                !Number.isNaN(row.lng) &&
                row.lat !== 0 &&
                row.lng !== 0 &&
                row.event
            );

          setSegmentFirstEvent(eventRows.length ? eventRows[0].event : null);
          setSegmentLastEvent(
            eventRows.length ? eventRows[eventRows.length - 1].event : null
          );




          // Build positions for the polyline based on full_latitude and full_longitude
          // But handle them as strings and convert to numbers
          const mappedPositions = result
            .filter(
              (item: any) =>
                item.full_latitude &&
                item.full_longitude &&
                item.full_latitude !== '0' &&
                item.full_longitude !== '0'
            )
            .map(
              (item: any) =>
                [
                  parseFloat(item.full_latitude),
                  parseFloat(item.full_longitude)
                ] as [number, number]
            )
            // Filter out any invalid coordinates after parsing
            .filter(
              (coords: [number, number]) =>
                !isNaN(coords[0]) && !isNaN(coords[1])
            );

          setPositions(mappedPositions);

          if (mappedPositions.length > 0) {
            clearInterval(interval);
          } else {
            console.log('No valid coordinates found in the data');
          }
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
        const response = await fetch(`${apiBaseUrl}${port}/tgnia-rpl-s5`);
        const result = await response.json();

        if (Array.isArray(result) && result.length > 0) {
          // Process marker data - filter for events containing "BMH" or "BU"
          const markerData = result
            .filter(
              (item: any) =>
                item.event &&
                typeof item.event === 'string' &&
                (item.event.includes('S5.RT') ||
                  item.event.includes('S5.RN') ||
                  item.event.includes('BU'))
            )
            .map((item: any) => ({
              latitude: parseFloat(item.full_latitude),
              longitude: parseFloat(item.full_longitude),
              label: item.event
            }))
            // Filter out any markers with invalid coordinates
            .filter(
              (marker: any) =>
                !isNaN(marker.latitude) && !isNaN(marker.longitude)
            );

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


  // Define polyline path options based on hover state
  const getPathOptions = () => {
    // Always use yellow for TGN-IA segments
    const baseColor = '#FFFF00';

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
  const segmentLengthLabel = segmentLengthKm !== null
    ? `${segmentLengthKm.toFixed(3)} km`
    : '-- km';
  const segmentEventLabel =
    segmentFirstEvent && segmentLastEvent
      ? `${segmentFirstEvent} <span aria-hidden=\"true\" style=\"padding: 0 6px;\">&rarr;</span> ${segmentLastEvent}`
      : '--';


  return (
    <>
      <CableCutMarkers cableSegment="tgnia5" />
      {/* Polyline Path with Hover Popup and Glowing Effect */}
      <Polyline
        positions={positions}
        pathOptions={getPathOptions()}
        eventHandlers={{
          mouseover: (e) => {
            const layer = e.target;
            const latlng = e.latlng;

            // Set hover state to trigger glow effect
            setIsHovered(true);

            // Create hover popup that follows cursor
            layer
              .bindTooltip(`<div style="text-align: center; font-size: 12.5px; line-height: 1.35;"><div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">TGN-IA Segment 5</div><div style="color: #4b5563; margin-bottom: 4px;">${segmentLengthLabel}</div><div style="color: #111827;">${segmentEventLabel}</div></div>`, {
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
      })}    </>
  );
}

export default RPLTGNIA5;
