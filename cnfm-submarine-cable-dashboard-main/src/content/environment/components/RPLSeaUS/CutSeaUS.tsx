import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import {
  Typography,
  Box,
  Divider,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import Segment1SeaUS from './Segment1SeaUS';
import Segment2SeaUS from './Segment2SeaUS';
import Segment3SeaUS from './Segment3SeaUS';
import Segment4SeaUS from './Segment4SeaUS';
import Segment5SeaUS from './Segment5SeaUS';
import Segment6SeaUS from './Segment6SeaUS';

interface CutSeaUSProps {
  handleClose?: () => void;
}

const CutSeaUS: React.FC<CutSeaUSProps> = ({ handleClose }) => {
  const map = useMap();
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const cutMarkersRef = useRef<Record<string, L.Marker>>({});
  const [open, setOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number>(1);

  useEffect(() => {
    // Remove default attribution control
    map.attributionControl.remove();

    // Create custom control
    const customControl = L.control({
      position: 'bottomright'
    });

    // Create a div for React to render into
    buttonContainerRef.current = L.DomUtil.create('div');

    // Add the custom control to the map
    customControl.onAdd = function () {
      const container = L.DomUtil.create('div');
      container.appendChild(buttonContainerRef.current as HTMLDivElement);
      return container;
    };

    customControl.addTo(map);

    // Cleanup function
    return () => {
      map.removeControl(customControl);
      Object.values(cutMarkersRef.current).forEach((marker) => {
        map.removeLayer(marker);
      });
    };
  }, [map]);

  // Handle dropdown change
  const handleSegmentChange = (event: SelectChangeEvent<number>) => {
    setSelectedSegment(event.target.value as number);
  };

  // Handle Dialog Open/Close
  const handleOpen = () => setOpen(true);

  // Update local handleDialogClose to manage both the local state and call the parent's handleClose if provided
  const handleDialogClose = () => {
    setOpen(false);
    if (handleClose) {
      handleClose();
    }
  };

  // Render the appropriate segment component based on selection
  const renderSegmentComponent = () => {
    switch (selectedSegment) {
      case 1:
        return <Segment1SeaUS handleClose={handleDialogClose} />;
      case 2:
        return <Segment2SeaUS handleClose={handleDialogClose} />;
      case 3:
        return <Segment3SeaUS handleClose={handleDialogClose} />;
      case 4:
        return <Segment4SeaUS handleClose={handleDialogClose} />;
      case 5:
        return <Segment5SeaUS handleClose={handleDialogClose} />;
      case 6:
        return <Segment6SeaUS handleClose={handleDialogClose} />;
      default:
        return <Segment1SeaUS handleClose={handleDialogClose} />;
    }
  };

  // Only render the button if the container ref is available
  return buttonContainerRef.current
    ? ReactDOM.createPortal(
      <>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#2e7d32',
            fontSize: '12px',
            '&:hover': {
              backgroundColor: '#1b5e20'
            }
          }}
          startIcon={<ContentCutIcon />}
          onClick={handleOpen}
        >
          Cut SEA-US Cable
        </Button>

        {/* Modal Dialog */}
        <Dialog
          open={open}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ mt: 3 }}>
            <Typography variant="h5">Simulate SEA-US Cable Fault</Typography>
          </DialogTitle>
          <Divider />
          <CardContent>
            <Box sx={{ width: '100%' }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="segment-select-label">
                  Select Segment
                </InputLabel>
                <Select
                  labelId="segment-select-label"
                  id="segment-select"
                  value={selectedSegment}
                  label="Select Segment"
                  onChange={handleSegmentChange}
                >
                  <MenuItem value={1}>
                    Segment 1 | Kauditan - BU Davao City
                  </MenuItem>
                  <MenuItem value={2}>
                    Segment 2 | Davao - BU Davao City
                  </MenuItem>
                  <MenuItem value={3}>
                    Segment 3 | Piti - BU Davao City
                  </MenuItem>
                  <MenuItem value={4}>Segment 4 | Piti - Hawaii BU</MenuItem>
                  <MenuItem value={5}>
                    Segment 5 | Hawaii - Hawaii BU
                  </MenuItem>
                  <MenuItem value={6}>
                    Segment 6 | Hermosa, USA - Hawaii BU
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Render the selected segment component */}
              {renderSegmentComponent()}
            </Box>
          </CardContent>
        </Dialog>
      </>,
      buttonContainerRef.current
    )
    : null;
};

export default CutSeaUS;
