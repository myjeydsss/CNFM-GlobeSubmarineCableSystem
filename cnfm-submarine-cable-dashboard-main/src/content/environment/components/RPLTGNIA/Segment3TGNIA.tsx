import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import { Typography, Box, Divider } from '@mui/material';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { getFormikErrorText, hasFormikError } from '../../../../utils/formikHelpers';
import { useDeletedCables, useDeleteCable } from '../../../../hooks/useApi';

// Define prop types for TypeScript
interface Segment3TGNIAProps {
  handleClose?: () => void;
  onCutAdded?: (cut: any) => void;
  existingCuts?: any[];
}

// Validation schema
const validationSchema = Yup.object({
  kmValue: Yup.number()
    .required('Distance value is required')
    .min(0, 'Distance out of bounds (BU2)')
    .max(1333.277, 'Distance cannot exceed BU3A'),
  cutType: Yup.string().required('Cut type selection is required')
});

const Segment3TGNIA: React.FC<Segment3TGNIAProps> = ({
  handleClose: externalHandleClose,
  onCutAdded,
  existingCuts = []
}) => {
  const map = useMap();
  const cutMarkersRef = useRef({});
  const [cableData, setCableData] = useState([]);
  const [markerData, setMarkerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedCuts, setProcessedCuts] = useState([]);

  // Replace context with local array state
  const [cuts, setCuts] = useState(existingCuts);

  const { mutate: deleteCable } = useDeleteCable();
  const { refetch: refetchDeletedCables } = useDeletedCables();

  const cable = 'TGNIA';

  // Add refs to track component mount status and cleanup
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;

  // Function to safely update state only if component is mounted
  const safeSetState = (setter: Function, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  // Function to add a new cut to the array
  const addCut = (newCut) => {
    if (!isMountedRef.current) return;

    setCuts((prevCuts) => {
      const updatedCuts = [...prevCuts, newCut];
      return updatedCuts;
    });

    if (onCutAdded) {
      onCutAdded(newCut);
    }
  };

  // Fetch cable data from API with abort controller
  const fetchCableData = async () => {
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${apiBaseUrl}${port}/tgnia-rpl-s3`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setCableData(data);
      }

      return data;
    } catch (err) {
      // Don't update state if the error is due to abortion (component unmounted)
      if (err.name === 'AbortError') {
        console.log('Fetch cable data aborted');
        return;
      }

      console.error('Error fetching cable data:', err);
      safeSetState(setError, err.message);
      throw err;
    }
  };

  // Fetch marker data based on your reference with abort controller
  const fetchMarkerData = async () => {
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${apiBaseUrl}${port}/fetch-cable-cuts`, {
        signal: abortControllerRef.current.signal
      });

      const result = await response.json();

      if (Array.isArray(result) && result.length > 0) {
        const markers = result
          .filter(
            (item) =>
              item.cut_id &&
              typeof item.cut_id === 'string' &&
              item.cut_id.includes('tgnia3')
          )
          .map((item) => ({
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            label: item.cut_type,
            timestamp: item.simulated,
            distance: parseFloat(item.distance) || 0,
            depth: item.depth || 'Unknown'
          }));

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setMarkerData(markers);
        }

        return markers;
      } else {
        return [];
      }
    } catch (err) {
      // Don't update state if the error is due to abortion (component unmounted)
      if (err.name === 'AbortError') {
        console.log('Fetch marker data aborted');
        return [];
      }

      console.error('Error fetching marker data:', err);
      throw err;
    }
  };

  // useEffect for interval refresh with proper cleanup
  useEffect(() => {
    const startMarkerDataFetching = async () => {
      try {
        await fetchMarkerData();

        // Only set interval if component is still mounted
        if (isMountedRef.current) {
          intervalRef.current = setInterval(async () => {
            if (isMountedRef.current) {
              try {
                await fetchMarkerData();
              } catch (error) {
                console.error('Error in interval fetch:', error);
              }
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error in initial marker data fetch:', error);
      }
    };

    startMarkerDataFetching();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [apiBaseUrl, port]);

  // Function to determine cut type based on marker label or other criteria
  const determineCutType = (marker) => {
    const label = marker.label.toLowerCase();

    // You can customize this logic based on your requirements
    if (label.includes('fault') || label.includes('shunt')) {
      return 'Shunt Fault';
    } else if (label.includes('partial') || label.includes('degraded')) {
      return 'Partial Fiber Break';
    } else if (label.includes('break') || label.includes('cut')) {
      return 'Fiber Break';
    } else if (label.includes('anchor') || label.includes('drag')) {
      return 'Full Cut';
    } else {
      // Default cut type - you can randomize this or use other logic
      const cutTypes = [
        'Shunt Fault',
        'Partial Fiber Break',
        'Fiber Break',
        'Full Cut'
      ];
      return cutTypes[Math.floor(Math.random() * cutTypes.length)];
    }
  };

  // Process markers into cuts
  const processMarkersIntoCuts = (markers) => {
    const newCuts = markers.map((marker, index) => ({
      id: `marker-cut-${Date.now()}-${index}`,
      distance: marker.distance,
      cutType: determineCutType(marker),
      timestamp: marker.timestamp,
      latitude: marker.latitude,
      longitude: marker.longitude,
      depth: marker.depth
    }));

    safeSetState(setProcessedCuts, newCuts);
    return newCuts;
  };

  // Fetch all data and process cuts with proper error handling
  const fetchAllData = async () => {
    if (!isMountedRef.current) return;

    try {
      safeSetState(setLoading, true);
      safeSetState(setError, null);

      // Fetch both cable data and marker data
      const [cableResult, markerResult] = await Promise.all([
        fetchCableData(),
        fetchMarkerData()
      ]);

      // Only proceed if component is still mounted
      if (!isMountedRef.current) return;

      // Process markers into cuts
      if (markerResult && markerResult.length > 0) {
        const newCuts = processMarkersIntoCuts(markerResult);

        // Add all processed cuts to the cuts array
        setCuts((prevCuts) => [...prevCuts, ...newCuts]);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('Error fetching data:', err);
      safeSetState(setError, err.message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [apiBaseUrl, port]);

  // Display existing cuts on the map when component mounts or cuts change
  useEffect(() => {
    if (cableData.length > 0 && isMountedRef.current) {
      cuts.forEach((cut) => {
        displayCutOnMap(cut);
      });
    }
  }, [cuts, cableData, map]);

  // Cleanup effect to handle component unmounting
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Abort any ongoing fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clean up map markers
      Object.values(cutMarkersRef.current).forEach((marker: any) => {
        if (map && marker) {
          try {
            map.removeLayer(marker);
          } catch (error) {
            console.warn('Error removing marker:', error);
          }
        }
      });
      cutMarkersRef.current = {};
    };
  }, [map]);

  // Function to find cable segments based on cut distance
  const findCableSegmentsForCutDistance = (distance) => {
    if (!cableData || cableData.length === 0) {
      return { beforeCut: null, afterCut: null };
    }

    const sortedData = [...cableData].sort(
      (a, b) =>
        parseFloat(a.cable_cumulative_total) -
        parseFloat(b.cable_cumulative_total)
    );

    const cutDistance = parseFloat(distance);
    let beforeCut = null;
    let afterCut = null;

    for (let i = 0; i < sortedData.length; i++) {
      const currentTotal = parseFloat(sortedData[i].cable_cumulative_total);

      if (currentTotal >= cutDistance) {
        afterCut = sortedData[i];
        if (i > 0) {
          beforeCut = sortedData[i - 1];
        }
        break;
      }

      if (i === sortedData.length - 1) {
        beforeCut = sortedData[i];
      }
    }

    return { beforeCut, afterCut };
  };

  // Function to calculate the interpolated cut point
  const calculateCutPoint = (beforeCut, afterCut, kmValue) => {
    if (!beforeCut || !afterCut) {
      return beforeCut
        ? [
          parseFloat(beforeCut.full_latitude),
          parseFloat(beforeCut.full_longitude)
        ]
        : afterCut
          ? [
            parseFloat(afterCut.full_latitude),
            parseFloat(afterCut.full_longitude)
          ]
          : null;
    }

    const beforePoint = [
      parseFloat(beforeCut.full_latitude),
      parseFloat(beforeCut.full_longitude)
    ];
    const afterPoint = [
      parseFloat(afterCut.full_latitude),
      parseFloat(afterCut.full_longitude)
    ];
    const beforeDist = parseFloat(beforeCut.cable_cumulative_total);
    const afterDist = parseFloat(afterCut.cable_cumulative_total);

    const totalSegmentLength = afterDist - beforeDist;
    const distanceFromBefore = parseFloat(kmValue) - beforeDist;
    const ratio = distanceFromBefore / totalSegmentLength;

    const cutLat = beforePoint[0] + ratio * (afterPoint[0] - beforePoint[0]);
    const cutLng = beforePoint[1] + ratio * (afterPoint[1] - beforePoint[1]);

    return [cutLat, cutLng];
  };

  // Get marker style based on cut type
  const getMarkerStyle = (cutType) => {
    const styles = {
      'Shunt Fault': { color: '#FFA726', size: 20, borderColor: 'white' },
      'Partial Fiber Break': {
        color: '#EF5350',
        size: 20,
        borderColor: 'white'
      },
      'Fiber Break': { color: '#B71C1C', size: 20, borderColor: 'white' },
      'Full Cut': { color: '#6A1B9A', size: 20, borderColor: 'white' }
    };
    return styles[cutType] || { color: 'red', size: 20, borderColor: 'white' };
  };

  // Add popup styles to document
  const addPopupStyles = () => {
    if (!document.getElementById('cable-cut-popup-styles')) {
      const style = document.createElement('style');
      style.id = 'cable-cut-popup-styles';
      style.innerHTML = `
          .cable-cut-custom-popup .leaflet-popup-content-wrapper {
            padding: 0; margin: 0; background: none; box-shadow: none; border: none;
          }
          .cable-cut-custom-popup .leaflet-popup-content {
            margin: 0; padding: 0; width: auto !important; background: none; box-shadow: none;
          }
          .cable-cut-custom-popup .leaflet-popup-tip-container,
          .cable-cut-custom-popup .leaflet-popup-tip { display: none; }
          .cable-cut-custom-popup .leaflet-popup-close-button { display: none; }
          .cable-cut-custom-popup.leaflet-popup { margin-bottom: 0; }
        `;
      document.head.appendChild(style);
    }
  };

  // Create popup content
  const createPopupContent = (cut, markerStyle, cutPoint, depth) => {
    return `
        <div class="cable-cut-popup" style="font-family: Arial, sans-serif; width: 250px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); border-radius: 4px; overflow: hidden;">
          <div style="background-color: ${markerStyle.color
      }; color: white; padding: 8px; text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">
            ${cut.cutType.toUpperCase()}
          </div>
          <div style="background-color: white; padding: 12px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="font-weight: bold; padding-bottom: 8px;">Distance:</td>
                <td style="text-align: right; padding-bottom: 8px;">${Number(
        cut.distance
      ).toFixed(3)} km</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-bottom: 8px;">Depth:</td>
                <td style="text-align: right; padding-bottom: 8px;">${depth} m</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-bottom: 8px;">Latitude:</td>
                <td style="text-align: right; padding-bottom: 8px;">${cutPoint ? Number(cutPoint[0]).toFixed(6) : ''
      }</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-bottom: 8px;">Longitude:</td>
                <td style="text-align: right; padding-bottom: 8px;">${cutPoint ? Number(cutPoint[1]).toFixed(6) : ''
      }</td>
              </tr>
            </table>
            <div style="font-size: 11px; color: #777; text-align: right; margin-top: 8px; font-style: italic;">
              Simulated: ${new Date(cut.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      `;
  };

  // Function to display a cut on the map
  const displayCutOnMap = (cut) => {
    if (!cableData || cableData.length === 0 || !isMountedRef.current) return;

    // For API-sourced cuts, use the coordinates directly if available
    let cutPoint;
    if (cut.latitude && cut.longitude) {
      cutPoint = [cut.latitude, cut.longitude];
    } else {
      const { beforeCut, afterCut } = findCableSegmentsForCutDistance(
        cut.distance
      );
      cutPoint = calculateCutPoint(beforeCut, afterCut, cut.distance);
    }

    if (cutPoint && map) {
      if (cutMarkersRef.current[cut.id]) {
        try {
          map.removeLayer(cutMarkersRef.current[cut.id]);
        } catch (error) {
          console.warn('Error removing existing marker:', error);
        }
      }

      const markerStyle = getMarkerStyle(cut.cutType);
      const depth = cut.depth || 'Unknown';

      try {
        cutMarkersRef.current[cut.id] = L.marker(cutPoint, {
          icon: L.divIcon({
            className: `cut-marker-${cut.cutType}`,
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
        }).addTo(map);

        addPopupStyles();
        const popupContent = createPopupContent(
          cut,
          markerStyle,
          cutPoint,
          depth
        );

        cutMarkersRef.current[cut.id].bindPopup(popupContent, {
          className: 'cable-cut-custom-popup',
          maxWidth: 250,
          minWidth: 250,
          closeButton: false,
          autoClose: false,
          offset: [0, 0]
        });
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    }
  };

  const handleCut = async (values) => {
    if (!isMountedRef.current) return;

    const { kmValue, cutType, faultDate } = values;
    const { beforeCut, afterCut } = findCableSegmentsForCutDistance(kmValue);
    const cutPoint = calculateCutPoint(beforeCut, afterCut, kmValue);

    if (externalHandleClose) {
      externalHandleClose();
    }

    if (!cutPoint) {
      console.error('Could not calculate cut point');
      return Swal.fire({
        icon: 'error',
        title: 'Calculation Error',
        text: 'Could not calculate cut point. Please check the distance value and try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      });
    }

    const newCut = {
      cut_id: `tgnia3-${Date.now()}`,
      distance: Number(kmValue),
      cut_type: cutType,
      fault_date: faultDate,
      simulated: new Date().toISOString(),
      latitude: cutPoint[0],
      longitude: cutPoint[1],
      depth: beforeCut?.Depth || afterCut?.Depth || 'Unknown',
      cable: "tgnia",
      segment: "s3"
    };

    try {
      // Create new abort controller for this request
      const controller = new AbortController();

      const response = await fetch(`${apiBaseUrl}${port}/cable-cuts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCut),
        signal: controller.signal
      });

      const result = await response.json();

      // Handle different HTTP status codes
      if (!response.ok) {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        let errorTitle = 'Server Error';

        switch (response.status) {
          case 409:
            errorTitle = 'Duplicate Entry';
            errorMessage =
              result.message || 'A cable cut at this location already exists.';
            break;
          case 500:
            errorTitle = 'Server Error';
            errorMessage =
              'Internal server error. Please try again later or contact support.';
            break;
          default:
            errorMessage =
              result.message ||
              `Server returned status ${response.status}. Please try again.`;
        }

        throw new Error(
          JSON.stringify({ title: errorTitle, message: errorMessage })
        );
      }

      // Only proceed if component is still mounted
      if (!isMountedRef.current) return;

      // Success - close loading and show success message
      const displayCut = {
        id: newCut.cut_id,
        distance: newCut.distance,
        cutType: newCut.cut_type,
        faultDate: newCut.fault_date,
        timestamp: newCut.simulated,
        latitude: newCut.latitude,
        longitude: newCut.longitude,
        depth: newCut.depth
      };

      // Add to local state for immediate display
      addCut(displayCut);

      // Display on map
      displayCutOnMap(displayCut);

      // Fly to the cut location
      if (map && isMountedRef.current) {
        map.flyTo(cutPoint, 7.7, {
          animate: true,
          duration: 0.5
        });
        
        // Refetch deleted cables to update the sidebar
        refetchDeletedCables();
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error saving cut:', error);

      let errorData;
      try {
        errorData = JSON.parse(error.message);
      } catch {
        errorData = {
          title: 'Connection Error',
          message:
            'Unable to connect to the server. Please check your internet connection and try again.'
        };
      }

      // Show error message
      Swal.fire({
        icon: 'error',
        title: errorData.title,
        text: errorData.message,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          // Optionally retry the operation
          // handleCut(values);
        }
      });
    }
  };


  return (
    <Box>
      <Divider />
      <DialogContent>
        <Formik
          initialValues={{ kmValue: '', cutType: '', faultDate: '' }}
          validationSchema={validationSchema}
          onSubmit={handleCut}
        >
          {({ values, errors, touched, handleChange, handleBlur, isValid }) => (
            <Form>
              <DialogContentText sx={{ mb: 1 }}>
                Enter the distance in kilometers where you want to simulate a
                cable cut:
              </DialogContentText>

              <TextField
                margin="dense"
                id="kmValue"
                name="kmValue"
                label="Distance (km)"
                type="number"
                fullWidth
                variant="outlined"
                value={values.kmValue}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.kmValue && Boolean(errors.kmValue)}
                helperText={hasFormikError(touched.kmValue, errors.kmValue) ? getFormikErrorText(errors.kmValue) : ''}
              />

              <Box sx={{ mt: 2 }}>
                <TextField
                  margin="dense"
                  id="faultDate"
                  name="faultDate"
                  label="Fault Date"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={values.faultDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.faultDate && Boolean(errors.faultDate)}
                  helperText={hasFormikError(touched.faultDate, errors.faultDate) ? getFormikErrorText(errors.faultDate) : ''}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 0 }}>
                <FormControl
                  component="fieldset"
                  error={touched.cutType && Boolean(errors.cutType)}
                >
                  <FormLabel component="legend">Select cut type:</FormLabel>
                  <RadioGroup
                    row
                    aria-label="cut-type"
                    name="cutType"
                    value={values.cutType}
                    onChange={handleChange}
                  >
                    <FormControlLabel
                      value="Shunt Fault"
                      control={<Radio />}
                      label="Shunt Fault"
                    />
                    <FormControlLabel
                      value="Partial Fiber Break"
                      control={<Radio />}
                      label="Partial Fiber Break"
                    />
                    <FormControlLabel
                      value="Fiber Break"
                      control={<Radio />}
                      label="Fiber Break"
                    />
                    <FormControlLabel
                      value="Full Cut"
                      control={<Radio />}
                      label="Full Cut"
                    />
                  </RadioGroup>
                  {touched.cutType && errors.cutType && (
                    <Typography color="error" variant="caption">
                      {getFormikErrorText(errors.cutType)}
                    </Typography>
                  )}
                </FormControl>
              </Box>


              <DialogActions>
                <Button
                  onClick={() => externalHandleClose && externalHandleClose()}
                  color="primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!isValid}
                >
                  Cut Cable
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Box>
  );
};

export default Segment3TGNIA;

