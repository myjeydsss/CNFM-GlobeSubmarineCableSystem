import { Helmet } from 'react-helmet-async';
import Footer from 'src/components/Footer';
import {
  Card,
  Box,
  Grid,
  Typography,
  useTheme,
  Container
} from '@mui/material';
import React, { useRef } from 'react';
import Header from 'src/components/Header';
import SimulationMap from './components/SimulationMap';
import L from 'leaflet';

function SimulationEnvironment() {
  const theme = useTheme();
  const mapRef = useRef<L.Map | null>(null);

  return (
    <Box
      sx={{
        backgroundColor: '#F1F4FA', // Lightest blue for background
        minHeight: '100vh'
      }}
    >
      {/* Remove default focus outline on Leaflet maps across the simulation environment */}
      <style>{`
        .leaflet-container:focus {
          outline: none !important;
        }
      `}</style>
      <Helmet>
        <title>Simulation Dashboard</title>
      </Helmet>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ pb: 3, px: 2 }}
      ></Box>

      <Container maxWidth="xl">
        {/* Simulation Environment Indicator */}
        <Box
          mb={3}
          p={1.5}
          sx={{
            backgroundColor: '#C7D9EF', // Light blue for indicator box
            borderRadius: theme.shape.borderRadius,
            border: '1px solid #3854A5', // Primary blue border
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h5"
            sx={{ color: '#3854A5', fontWeight: 'bold' }} // Primary blue text
          >
            Simulation Environment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Safe Environment - Changes made here won't affect the data uploaded
            to the main dashboard.
          </Typography>
        </Box>

        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={2}
        >
          <Grid item xs={12}>
            <Card
              sx={{
                overflow: 'hidden', // Changed from 'visible' to 'hidden' to respect border radius
                borderLeft: '4px solid #3854A5', // Primary blue border on cards
                boxShadow: '0 4px 20px 0 rgba(56, 84, 165, 0.1)', // Subtle blue shadow
                position: 'relative',
                height: '70vh', // Set fixed height for the card
                minHeight: '600px', // Minimum height
                borderRadius: '12px' // Added border radius
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px', // Match the card's border radius
                  overflow: 'hidden' // Ensure map respects the border radius
                }}
              >
                {/* Map Container */}
                <Box sx={{ width: '100%', height: '100%' }}>
                  <SimulationMap mapRef={mapRef} />
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}

export default SimulationEnvironment;
