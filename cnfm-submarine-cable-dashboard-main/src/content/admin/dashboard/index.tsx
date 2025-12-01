import { Helmet } from 'react-helmet-async';
import Footer from 'src/components/Footer';
import {
  Card,
  Box,
  Grid,
  Typography,
  useTheme,
  Container,
  Button
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Swal from 'sweetalert2';
import Header from 'src/components/Header';
import CableMap from '../components/CableMap';
import React, { useEffect, useState, useCallback } from 'react';
import SegmentUpdate from './SegmentUpdate';

const legendItems = [
  { name: 'TGN-IA', color: '#FFFF00', },
  { name: 'SJC', color: '#1976D2' },
  { name: 'SEA-US', color: '#2E7D32' },
  { name: 'C2C', color: 'gray' }
];

function AdminDashboard() {
  const theme = useTheme();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // ✅ Create a reusable fetch function
  const fetchLastUpdate = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${port}/latest-update`);
      const data = await response.json();

      if (data?.update?.date_time && data.update.file_name) {
        const fileName = data.update.file_name;
        // Fix: Remove both '.csv' and 'csv' at the end
        const displayName = fileName.replace(/\.?csv$/i, '');
        setLastUpdate(displayName);
        return true;
      } else {
        // Do NOT clear lastUpdate if no data is found
        console.log('No update timestamp received');
        return false;
      }
    } catch (err) {
      console.error('Error fetching latest update:', err);
      // Do NOT clear lastUpdate on error
      return false;
    }
  }, [apiBaseUrl, port]);

  const handleClearData = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Are you absolutely sure?',
      text: 'This action cannot be undone. This will permanently remove all the data, do you want to proceed?',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: 'gray',
      confirmButtonText: 'Continue',
      reverseButtons: true
    });

    if (!isConfirmed) return;

    try {
      const response = await fetch(`${apiBaseUrl}${port}/clear-utilization`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: 'Old data removed!',
          text: result.message || 'Data has been cleared.',
          icon: 'success',
          confirmButtonColor: '#3854A5'
        });

        // ✅ Only reload after confirming the success alert
        window.location.reload();
        // ✅ Refetch the latest update after clearing
        await fetchLastUpdate();
      } else {
        throw new Error(result.message || 'Failed to clear data');
      }
    } catch (error) {
      Swal.fire('Error!', error.message || 'Something went wrong', 'error');
      console.error('Clear error:', error);
    }
  };

  const handleNewDataClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      Swal.fire('Invalid file type', 'Only .csv files are allowed', 'error');
      return;
    }

    console.log('Selected CSV file:', file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBaseUrl}${port}/upload-csv`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire('Success', 'File uploaded successfully', 'success');

        // Add a delay before fetching the latest update
        setTimeout(async () => {
          await fetchLastUpdate();
        }, 1500); // 1.5 seconds delay
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      Swal.fire(
        'Upload failed',
        err.message || 'Something went wrong',
        'error'
      );
      console.error('Upload error:', err);
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ Initial fetch with retry logic
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

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ pt: 5, px: 2 }}
      ></Box>
      <Container maxWidth="xl">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={2}
        >
          <Grid item xs={12}>
            <Card>
              <Grid spacing={0} container>
                <Grid item xs={12}>
                  <Box p={4}>
                    <Header />
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
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 10,
                              backgroundColor: item.color,
                              borderRadius: '2px',
                              mr: 1
                            }}
                          />
                          <Typography variant="body2">{item.name}</Typography>
                        </Box>
                      ))}
                      <Box sx={{ flexGrow: 1 }} />
                      <Box>
                        <Typography variant="body2">
                          Source File: {lastUpdate || 'No Source Found'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          mb: 2
                        }}
                      >

                        <Button
                          variant="contained"
                          startIcon={<UploadFileIcon />}
                          onClick={handleNewDataClick}
                          color="primary"
                          sx={{
                            mx: 0.5
                          }}
                        >
                          New Data
                        </Button>
                        <input
                          type="file"
                          accept=".csv"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <SegmentUpdate />
                      </Box>
                    </Box>
                    <CableMap />
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

export default AdminDashboard;