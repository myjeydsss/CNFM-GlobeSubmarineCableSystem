import { Helmet } from 'react-helmet-async';
import { Box } from '@mui/material';
import React, { useState, useRef } from 'react';
import UserCableMap from './UserCableMap';
import L from 'leaflet';

interface CableData {
  cut_id?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  depth?: number;
  fault_date?: string;
  cut_type?: string;
  cable_type?: string;
  simulated?: string;
  [key: string]: any;
}

function UserDashboard() {
  const [selectedCable, setSelectedCable] = useState<CableData | null>(null);
  const [selectedCutType, setSelectedCutType] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  return (
    <>
      <Helmet>
        <title>User Dashboard</title>
      </Helmet>
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <UserCableMap
          selectedCable={selectedCable}
          selectedCutType={selectedCutType}
          mapRef={mapRef}
          onCloseCablePopup={() => {
            setSelectedCable(null);
            setSelectedCutType(null);
          }}
        />
      </Box>
    </>
  );
}

export default UserDashboard;
