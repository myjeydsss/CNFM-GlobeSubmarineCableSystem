import { Helmet } from 'react-helmet-async';
import Footer from 'src/components/Footer';
import {
  Card,
  Box,
  Grid,
  Typography,
  Container
} from '@mui/material';
import Header from 'src/components/Header';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import CableMap from '../admin/components/CableMap';
import L from 'leaflet';

// Types
interface LegendItem {
  name: string;
  color: string;
}

interface CableData {
  cut_id: string;
  latitude: number;
  longitude: number;
  [key: string]: any; // for other properties
}

const legendItems: LegendItem[] = [
  { name: 'TGN-IA', color: 'yellow' },
  { name: 'SJC', color: 'blue' },
  { name: 'SEA-US', color: 'green' },
  { name: 'C2C', color: 'orange' }
];

function SimulatorDashboard() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [selectedCable, setSelectedCable] = useState<CableData | null>(null);
  const [selectedCutType, setSelectedCutType] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // ✅ Create a reusable fetch function
  const fetchLastUpdate = useCallback(async (): Promise<boolean> => {
    try {
      if (!apiBaseUrl || !port) {
        console.error('API configuration missing');
        return false;
      }

      const response = await fetch(`${apiBaseUrl}${port}/latest-update`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.update?.date_time) {
        const fileName = data.update.file_name;

        // ✅ Remove .csv extension for display
        const displayName = fileName
          ? fileName.replace(/\.csv$/i, '')
          : fileName;

        setLastUpdate(displayName);
        return true;
      } else {
        console.log('No update timestamp received');
        return false;
      }
    } catch (err) {
      console.error('Error fetching latest update:', err);
      return false;
    }
  }, [apiBaseUrl, port]);

  // ✅ Add useEffect to actually call the fetch function
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const initialFetch = async () => {
      const success = await fetchLastUpdate();

      if (!success) {
        // Retry every 2s until we get the data
        interval = setInterval(async () => {
          const retrySuccess = await fetchLastUpdate();
          if (retrySuccess) {
            clearInterval(interval);
          }
        }, 2000);
      }
    };

    initialFetch();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchLastUpdate]);

  return (
    <>
      <Helmet>
        <title>Main Dashboard</title>
      </Helmet>

      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ pt: 5, px: 2 }}></Box>
      <Container maxWidth="xl">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" spacing={2}>
          <Grid item xs={12}>
            <Card>
              <Grid spacing={0} container>
                <Grid item xs={12}>
                  <Box p={4} sx={{ position: 'relative' }}>
                    <Header />
                    {/* Legend */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        flexWrap: 'wrap',
                        mb: 1
                      }}
                    >
                      <Typography variant="h6">Legend:</Typography>
                      {legendItems.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 20, height: 10, backgroundColor: item.color, borderRadius: '2px', mr: 1 }} />
                          <Typography variant="body2">{item.name}</Typography>
                        </Box>
                      ))}
                      <Box sx={{ flexGrow: 1 }} />
                      <Box>
                        <Typography variant="body2">
                          Source File: {lastUpdate || 'No Source Found'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Map Container */}
                    <CableMap
                      selectedCable={selectedCable}
                      selectedCutType={selectedCutType}
                      mapRef={mapRef}
                      onCloseCablePopup={() => {
                        setSelectedCable(null);
                        setSelectedCutType(null);
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

export default SimulatorDashboard;