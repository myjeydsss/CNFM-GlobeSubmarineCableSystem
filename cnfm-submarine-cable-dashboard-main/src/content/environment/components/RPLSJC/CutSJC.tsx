import React, { SyntheticEvent, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
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
import Segment1SJC from './Segment1SJC';
import Segment3SJC from './Segment3SJC';
import Segment4SJC from './Segment4SJC';
import Segment5SJC from './Segment5SJC';
import Segment6SJC from './Segment6SJC';
import Segment7SJC from './Segment7SJC';
import Segment8SJC from './Segment8SJC';
import Segment9SJC from './Segment9SJC';
import Segment10SJC from './Segment10SJC';
import Segment11SJC from './Segment11SJC';
import Segment12SJC from './Segment12SJC';
import Segment13SJC from './Segment13SJC';

interface CutSJCProps {
  handleClose?: () => void;
}

const CutSJC: React.FC<CutSJCProps> = ({ handleClose }) => {
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
      container.appendChild(buttonContainerRef.current);
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
        return <Segment1SJC handleClose={handleDialogClose} />;
      case 3:
        return <Segment3SJC handleClose={handleDialogClose} />;
      case 4:
        return <Segment4SJC handleClose={handleDialogClose} />;
      case 5:
        return <Segment5SJC handleClose={handleDialogClose} />;
      case 6:
        return <Segment6SJC handleClose={handleDialogClose} />;
      case 7:
        return <Segment7SJC handleClose={handleDialogClose} />;
      case 8:
        return <Segment8SJC handleClose={handleDialogClose} />;
      case 9:
        return <Segment9SJC handleClose={handleDialogClose} />;
      case 10:
        return <Segment10SJC handleClose={handleDialogClose} />;
      case 11:
        return <Segment11SJC handleClose={handleDialogClose} />;
      case 12:
        return <Segment12SJC handleClose={handleDialogClose} />;
      case 13:
        return <Segment13SJC handleClose={handleDialogClose} />;
      default:
        return <Segment1SJC handleClose={handleDialogClose} />;
    }
  };

  // Only render the button if the container ref is available
  return buttonContainerRef.current
    ? ReactDOM.createPortal(
      <>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#0047FF',
            fontSize: '15px',
            '&:hover': {
              backgroundColor: '#0035C2'
            }
          }}
          startIcon={<ContentCutIcon />}
          onClick={handleOpen}
        >
          Cut SJC Cable
        </Button>

        {/* Modal Dialog */}
        <Dialog
          open={open}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ mt: 3 }}>
            <Typography variant="h5">Simulate SJC Cable Fault</Typography>
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
                    Segment 1 | Tuas - Lay Interface
                  </MenuItem>
                  <MenuItem value={3}>
                    Segment 3 | Lay Interface - Songkhla BU (BU2)
                  </MenuItem>
                  <MenuItem value={4}>
                    Segment 4 | Stubbed Cable End - Songkhla BU (BU2)
                  </MenuItem>
                  <MenuItem value={5}>
                    Segment 5 | Songkhla BU (BU2) - Telisai BU (BU3)
                  </MenuItem>
                  <MenuItem value={6}>
                    Segment 6 | Telisai - Telisai BU (BU3)
                  </MenuItem>
                  <MenuItem value={7}>
                    Segment 7 | Telisai BU (BU3) - Nasugbu BU (BU4)
                  </MenuItem>
                  <MenuItem value={8}>
                    Segment 8 | Nasugbu - Nasugbu BU (BU4)
                  </MenuItem>
                  <MenuItem value={9}>
                    Segment 9 | Nasugbu BU (BU4) - Chung Hom Kok BU (BU5){' '}
                  </MenuItem>
                  <MenuItem value={10}>
                    Segment 10 | Chung Hom Kok - Chung Hom Kok (BU5)
                  </MenuItem>
                  <MenuItem value={11}>
                    Segment 11 | Shantou BU (BU6) - Chung Hom Kok BU (BU5)
                  </MenuItem>
                  <MenuItem value={12}>
                    Segment 12 | Shantou - Shantou BU (BU6)
                  </MenuItem>
                  <MenuItem value={13}>
                    Segment 13 | Chikura - Shantou BU (BU6)
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

export default CutSJC;
