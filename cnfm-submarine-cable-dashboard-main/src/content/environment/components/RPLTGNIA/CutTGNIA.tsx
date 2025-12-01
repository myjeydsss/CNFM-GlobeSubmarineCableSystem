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
import Segment1TGNIA from './Segment1TGNIA';
import Segment2TGNIA from './Segment2TGNIA';
import Segment3TGNIA from './Segment3TGNIA';
import Segment4TGNIA from './Segment4TGNIA';
import Segment5TGNIA from './Segment5TGNIA';
import Segment6TGNIA from './Segment6TGNIA';
import Segment7TGNIA from './Segment7TGNIA';
import Segment8TGNIA from './Segment8TGNIA';
import Segment9TGNIA from './Segment9TGNIA';
import Segment10TGNIA from './Segment10TGNIA';
import Segment11TGNIA from './Segment11TGNIA';
import Segment12TGNIA from './Segment12TGNIA';

interface CutTGNIAProps {
  handleClose?: () => void;
}

const CutTGNIA: React.FC<CutTGNIAProps> = ({ handleClose }) => {
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
        return <Segment1TGNIA handleClose={handleDialogClose} />;
      case 2:
        return <Segment2TGNIA handleClose={handleDialogClose} />;
      case 3:
        return <Segment3TGNIA handleClose={handleDialogClose} />;
      case 4:
        return <Segment4TGNIA handleClose={handleDialogClose} />;
      case 5:
        return <Segment5TGNIA handleClose={handleDialogClose} />;
      case 6:
        return <Segment6TGNIA handleClose={handleDialogClose} />;
      case 7:
        return <Segment7TGNIA handleClose={handleDialogClose} />;
      case 8:
        return <Segment8TGNIA handleClose={handleDialogClose} />;
      case 9:
        return <Segment9TGNIA handleClose={handleDialogClose} />;
      case 10:
        return <Segment10TGNIA handleClose={handleDialogClose} />;
      case 11:
        return <Segment11TGNIA handleClose={handleDialogClose} />;
      case 12:
        return <Segment12TGNIA handleClose={handleDialogClose} />;
      default:
        return <Segment1TGNIA handleClose={handleDialogClose} />;
    }
  };

  // Only render the button if the container ref is available
  return buttonContainerRef.current
    ? ReactDOM.createPortal(
      <>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#e6d600',
            fontSize: '12px',
            '&:hover': {
              backgroundColor: '#c2b400'
            }
          }}
          startIcon={<ContentCutIcon />}
          onClick={handleOpen}
        >
          Cut TGN-IA Cable
        </Button>

        {/* Modal Dialog */}
        <Dialog
          open={open}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ mt: 3 }}>
            <Typography variant="h5">Simulate TGN-IA Cable Fault</Typography>
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
                  <MenuItem value={1}>Segment 1 | Tenah Merah - BU1</MenuItem>
                  <MenuItem value={2}>Segment 2 | BU1 - BU2</MenuItem>
                  <MenuItem value={3}>Segment 3 | BU2 - BU3</MenuItem>
                  <MenuItem value={4}>Segment 4 | BU3 - BU4</MenuItem>
                  <MenuItem value={5}>Segment 5 | BU4 - BU5</MenuItem>
                  <MenuItem value={6}>Segment 6 | BU5 - BU6</MenuItem>
                  <MenuItem value={7}>
                    Segment 7 | Malaysia Stub (Clump Weight - BU1)
                  </MenuItem>
                  <MenuItem value={8}>Segment 8 | Vung Tau - BU2</MenuItem>
                  <MenuItem value={9}>
                    Segment 9 | Deep Water Bay - BU3
                  </MenuItem>
                  <MenuItem value={10}>
                    Segment 10 | Ballesteros - BU4
                  </MenuItem>
                  <MenuItem value={11}>
                    Segment 11 | China Stub (Clump Weight - BU5)
                  </MenuItem>
                  <MenuItem value={12}>
                    Segment 12 | TGN G2 Stub (BU7 - Clump Weight)
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

export default CutTGNIA;
