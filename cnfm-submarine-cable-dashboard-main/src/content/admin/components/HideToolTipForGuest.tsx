import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

// Import chart components
import TGNSingapore from '../charts/TGNIA/TGNSingapore';
import TGNHongkong from '../charts/TGNIA/TGNHongkong';
import TGNJapan from '../charts/TGNIA/TGNJapan';
import SJCSingapore from '../charts/SJC/SJCSingapore';
import SJCHongkong from '../charts/SJC/SJCHongkong';
import SJCJapan from '../charts/SJC/SJCJapan';
import Seattle from '../charts/SeaUS/Seattle';
import LosAngeles from '../charts/SeaUS/LosAngeles';
import C2CSingapore from '../charts/C2C/C2CSingapore';
import C2CHongkong from '../charts/C2C/C2CHongkong';
import C2CJapan from '../charts/C2C/C2CJapan';

// Constants
const COLORS = {
  primary: '#3854A5',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  background: 'rgba(255, 255, 255, 0.3)',
  text: {
    primary: '#000000',
    secondary: '#000000',
    muted: '#000000'
  }
};

const CABLE_SYSTEMS_CONFIG = [
  {
    name: 'TGN-IA',
    color: '#FFFF00', // Changed to yellow
    segments: [
      { name: 'Hong Kong', endpoint: '/tgnia-hongkong' },
      { name: 'Japan', endpoint: '/tgnia-japan' },
      { name: 'Singapore', endpoint: '/tgnia-singapore' }
    ]
  },
  {
    name: 'SJC',
    color: '#1976D2',
    segments: [
      { name: 'Hong Kong', endpoint: '/sjc-hongkong' },
      { name: 'Japan', endpoint: '/sjc-japan' },
      { name: 'Singapore', endpoint: '/sjc-singapore' }
    ]
  },
  {
    name: 'SEA-US',
    color: '#2E7D32',
    segments: [
      { name: 'Seattle', endpoint: '/sea-us-seattle' },
      { name: 'Los Angeles', endpoint: '/sea-us-la' }
    ]
  },
  {
    name: 'C2C',
    color: 'gray',
    segments: [
      { name: 'Hong Kong', endpoint: '/c2c-hongkong' },
      { name: 'Japan', endpoint: '/c2c-japan' },
      { name: 'Singapore', endpoint: '/c2c-singapore' }
    ]
  }
];

// Scrollbar styles
const scrollBarStyles = {
  scrollbarWidth: 'thin', // Firefox
  scrollbarColor: 'rgba(56, 84, 165, 0.6) transparent',
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-thumb': {
    background:
      'linear-gradient(180deg, rgba(56, 84, 165, 0.6) 0%, rgba(56, 84, 165, 0.8) 50%, rgba(56, 84, 165, 0.6) 100%)',
    borderRadius: '6px',
    transition: 'all 0.3s ease'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background:
      'linear-gradient(180deg, rgba(56, 84, 165, 0.8) 0%, rgba(56, 84, 165, 1) 50%, rgba(56, 84, 165, 0.8) 100%)'
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(56, 84, 165, 0.08)',
    borderRadius: '6px'
  }
};

// Styles
const styles = {
  container: {
    p: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    gap: 1
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    mb: 3,
    mt: 2
  },
  refreshButton: {
    color: COLORS.primary,
    '&:disabled': { color: '#ccc' }
  },
  capacityCard: {
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    p: 2,
    boxShadow: 2,
    mb: 3,
    width: '100%',
    maxWidth: 280,
    border: `1px solid rgba(56, 84, 165, 0.2)`
  },
  systemCard: (color: string) => ({
    background: 'rgba(0,0,0,0.25)',
    px: 1.25,
    py: 0.75,
    borderRadius: 14,
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    width: 'fit-content',
    minWidth: 'unset',
    display: 'inline-flex',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backdropFilter: 'blur(8px)',
    '&:hover': {
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      transform: 'translateY(-1px)',
      background: 'rgba(0,0,0,0.32)'
    },
    alignSelf: 'flex-end'
  })
};

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface CableSystemData {
  name: string;
  color: string;
  totalCapacity: number;
  totalUtilization: number;
  avgUtilization: number;
  activeSegments: number;
  zeroUtilizationCount: number;
  segments: Array<{
    name: string;
    capacity: number;
    utilization: number;
    endpoint: string;
  }>;
  lastUpdate: Date;
}

// Utility Components
const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 2 }}>
        <Typography>{children}</Typography>
      </Box>
    )}
  </div>
);

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`
});

// Chart Component Mapper
const renderChartComponent = (systemName: string, segmentIndex: number) => {
  const chartMap: Record<string, React.ComponentType[]> = {
    'TGN-IA': [TGNHongkong, TGNJapan, TGNSingapore],
    SJC: [SJCHongkong, SJCJapan, SJCSingapore],
    'SEA-US': [Seattle, LosAngeles],
    C2C: [C2CHongkong, C2CJapan, C2CSingapore]
  };

  const ChartComponent = chartMap[systemName]?.[segmentIndex];
  return ChartComponent ? <ChartComponent /> : <div>No data available</div>;
};

// Sub Components
const CapacityCard: React.FC<{
  totalGbps: number;
  utilization: string;
  difference: string;
}> = ({ totalGbps, utilization, difference }) => (
  <Paper sx={styles.capacityCard}>
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        sx={{
          color: COLORS.text.secondary,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: 1,
          mb: 1
        }}
      >
        CAPACITY:
      </Typography>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: '#000000', mb: 2 }}
      >
        {totalGbps} Gbps
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: COLORS.text.secondary,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: 1,
          mt: 1
        }}
      >
        AVERAGE UTILIZATION:
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: '#3854A5', mb: 1 }}
      >
        {utilization}
      </Typography>
    </Box>
  </Paper>
);

const SystemCard: React.FC<{
  system: CableSystemData;
  onClick: (system: CableSystemData) => void;
}> = ({ system, onClick }) => (
  <Paper onClick={() => onClick(system)} sx={styles.systemCard(system.color)}>
    {/* Header with utilization pill */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0.5,
        mb: 0.25
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          color: '#FFFFFF'
        }}
      >
        {system.name}
      </Typography>
      <Box
        sx={{
          minWidth: 'auto',
          width: 'fit-content',
          height: 26,
          borderRadius: '999px',
          backgroundColor: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 0.75
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          {`${system.avgUtilization}%`}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const StatRow: React.FC<{
  label: string;
  value: string;
  color: string;
  labelColor?: string;
}> = ({ label, value, color, labelColor }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 1.5,
      py: 0.5,
      px: 1,
      borderRadius: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)'
      }
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: labelColor || COLORS.text.primary,
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.5px'
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 700,
        color:
          label === 'Total Capacity:' || label === 'Average Utilization:'
            ? '#000000'
            : color,
        fontSize: '12px',
        textAlign: 'right'
      }}
    >
      {value}
    </Typography>
  </Box>
);

const SegmentRow: React.FC<{
  segment: {
    name: string;
    capacity: number;
    utilization: number;
    endpoint: string;
  };
  systemColor: string;
}> = ({ segment, systemColor }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mt: 1,
      p: 1,
      borderRadius: 2,
      backgroundColor:
        segment.utilization > 0 ? `${systemColor}15` : 'rgba(0,0,0,0.03)',
      border: `1px solid ${
        segment.utilization > 0 ? `${systemColor}30` : 'rgba(0,0,0,0.1)'
      }`,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor:
          segment.utilization > 0 ? `${systemColor}20` : 'rgba(0,0,0,0.08)',
        transform: 'translateX(2px)'
      }
    }}
  >
    <Typography
      variant="body2"
      sx={{
        fontSize: '11px',
        color: COLORS.text.primary,
        fontWeight: 600,
        letterSpacing: '0.3px'
      }}
    >
      {segment.name}
    </Typography>
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Typography
        variant="caption"
        sx={{
          fontSize: '10px',
          color: COLORS.text.muted,
          fontWeight: 500,
          minWidth: '35px',
          textAlign: 'right'
        }}
      >
        {segment.capacity.toLocaleString()}G
      </Typography>
      <Chip
        label={`${segment.utilization}%`}
        size="small"
        sx={{
          fontSize: '9px',
          height: '18px',
          minWidth: '40px',
          fontWeight: 600,
          backgroundColor: segment.utilization > 0 ? systemColor : '#e0e0e0',
          color:
            systemColor === '#FFFF00' && segment.utilization > 0
              ? '#000000'
              : segment.utilization > 0
              ? 'white'
              : '#757575',
          '& .MuiChip-label': {
            px: 1,
            color:
              systemColor === '#FFFF00' && segment.utilization > 0
                ? '#000000'
                : undefined
          }
        }}
      />
    </Box>
  </Box>
);

// Main Component
const HideToolTipForGuest: React.FC = () => {
  const [ipopUtilization, setIpopUtilization] = useState('0%');
  const [ipopDifference, setIpopDifference] = useState('0%');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    data: [],
    totalGbps: 0,
    avgUtilization: 0,
    zeroUtilizationCount: 0
  });

  // Modal state
  const [open, setOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<CableSystemData | null>(
    null
  );
  const [tabValue, setTabValue] = useState(0);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  // Initialize cable systems data
  const [cableSystemsData, setCableSystemsData] = useState<CableSystemData[]>(
    CABLE_SYSTEMS_CONFIG.map((config) => ({
      ...config,
      totalCapacity: 0,
      totalUtilization: 0,
      avgUtilization: 0,
      activeSegments: 0,
      zeroUtilizationCount: 0,
      segments: config.segments.map((seg) => ({
        ...seg,
        capacity: 0,
        utilization: 0
      })),
      lastUpdate: new Date()
    }))
  );

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
  const port = process.env.REACT_APP_PORT || ':8081';

  // API and Data Management
  console.log('HideToolTip API Config:', {
    apiBaseUrl,
    port,
    fullUrl: `${apiBaseUrl}${port}`
  });

  const fetchSegmentData = async (
    endpoint: string,
    systemName: string,
    segmentName: string
  ) => {
    try {
      const url = `${apiBaseUrl}${port}${endpoint}`;
      console.log(`Fetching ${systemName} ${segmentName} from:`, url);
      const response = await fetch(url);
      const result = await response.json();
      console.log(`${systemName} ${segmentName} response:`, result);

      if (Array.isArray(result) && result.length > 0) {
        const totalCapacity = result.reduce(
          (sum, item) => sum + (item.gbps_capacity || item.gbps || 0),
          0
        );
        const totalUtilization = result.reduce(
          (sum, item) => sum + (item.percent_utilization || item.percent || 0),
          0
        );
        const avgUtilization = parseFloat(
          (totalUtilization / result.length).toFixed(2)
        );

        return {
          capacity: totalCapacity,
          utilization: avgUtilization,
          rawData: result
        };
      }
    } catch (error) {
      console.error(`Error fetching ${systemName} ${segmentName}:`, error);
    }
    return { capacity: 0, utilization: 0, rawData: [] };
  };

  const fetchCableSystemData = async (system: CableSystemData) => {
    const updatedSegments = await Promise.all(
      system.segments.map(async (segment) => {
        const segmentData = await fetchSegmentData(
          segment.endpoint,
          system.name,
          segment.name
        );
        return {
          ...segment,
          ...segmentData
        };
      })
    );

    // Calculate system totals
    const totalCapacity = updatedSegments.reduce(
      (sum, seg) => sum + seg.capacity,
      0
    );
    const totalUtilization = updatedSegments.reduce(
      (sum, seg) => sum + seg.utilization,
      0
    );
    const avgUtilization =
      updatedSegments.length > 0
        ? parseFloat((totalUtilization / updatedSegments.length).toFixed(2))
        : 0;
    const activeSegments = updatedSegments.filter(
      (seg) => seg.utilization > 0
    ).length;
    const allRawData = updatedSegments.flatMap((seg) => seg.rawData || []);
    const zeroUtilizationCount = allRawData.filter(
      (item) => (item.percent_utilization || item.percent || 0) === 0
    ).length;

    return {
      ...system,
      segments: updatedSegments.map((seg) => ({
        name: seg.name,
        capacity: seg.capacity,
        utilization: seg.utilization,
        endpoint: seg.endpoint
      })),
      totalCapacity,
      totalUtilization,
      avgUtilization,
      activeSegments,
      zeroUtilizationCount,
      lastUpdate: new Date()
    };
  };

  const fetchAllCableSystems = async () => {
    console.log('Fetching all cable systems data...');
    const updatedSystems = await Promise.all(
      cableSystemsData.map((system) => fetchCableSystemData(system))
    );
    setCableSystemsData(updatedSystems);
    console.log('All cable systems updated:', updatedSystems);
  };

  const fetchDataSummary = async () => {
    try {
      const url = `${apiBaseUrl}${port}/data-summary`;
      console.log('Fetching from:', url);
      const response = await fetch(url);
      const result = await response.json();
      console.log('Data summary response:', result);

      if (Array.isArray(result) && result.length > 0) {
        const totalGbps = result.reduce(
          (sum, item) => sum + (item.gbps || 0),
          0
        );
        const totalUtilization = result.reduce(
          (sum, item) => sum + (item.percent || 0),
          0
        );
        const avgUtilization = parseFloat(
          (totalUtilization / result.length).toFixed(2)
        );
        const zeroCount = result.filter((item) => item.percent === 0).length;
        setStats({
          data: result,
          totalGbps,
          avgUtilization,
          zeroUtilizationCount: zeroCount
        });
        console.log('Stats updated:', { totalGbps, avgUtilization, zeroCount });
      } else {
        console.log('No data received, retrying...');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchIpopUtilization = async () => {
    try {
      const url = `${apiBaseUrl}${port}/average-util`;
      console.log('Fetching utilization from:', url);
      const response = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await response.json();
      console.log('Utilization response:', data);

      if (data?.current?.length) {
        const currentVal = parseFloat(data.current[0].a_side);
        setIpopUtilization(`${currentVal}%`);

        if (data?.previous?.length) {
          const previousVal = parseFloat(data.previous[0].a_side);
          const diff = currentVal - previousVal;
          const sign = diff > 0 ? '+' : '';
          setIpopDifference(`${sign}${diff.toFixed(2)}%`);
        } else {
          setIpopDifference('');
        }

        console.log('Utilization updated:', currentVal);
      } else {
        setIpopUtilization('0%');
        setIpopDifference('');
      }
    } catch (error) {
      console.error('Error fetching IPOP utilization:', error);
    }
  };

  // Effect Hooks
  useEffect(() => {
    fetchAllCableSystems();
    const interval = setInterval(fetchAllCableSystems, 10000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, port]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchData = () => {
      fetchDataSummary().then(() => clearInterval(interval));
    };
    fetchData();
    interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, port]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchUtil = () => {
      fetchIpopUtilization().then(() => clearInterval(interval));
    };
    fetchUtil();
    interval = setInterval(fetchUtil, 2000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, port]);

  // Event Handlers
  const handleRefresh = async () => {
    setIsLoading(true);
    setLastRefresh(new Date());

    try {
      await Promise.all([fetchAllCableSystems(), fetchDataSummary()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemClick = (system: CableSystemData) => {
    setSelectedSystem(system);
    setTabValue(0);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSystem(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Render
  return (
    <Box
      sx={styles.container}
      onMouseEnter={() => setIsTooltipHovered(true)}
      onMouseLeave={() => setIsTooltipHovered(false)}
    >
      {cableSystemsData.map((system) => (
        <SystemCard
          key={system.name}
          system={system}
          onClick={handleSystemClick}
        />
      ))}

      {/* Modal Dialog */}
      {selectedSystem && (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h4">
              {selectedSystem.name} Submarine Cable
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pb: 2 }}>
            <CardContent>
              <Box sx={{ width: '100%' }}>
                <Tabs
                  variant="scrollable"
                  scrollButtons="auto"
                  textColor="primary"
                  indicatorColor="primary"
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="cable system tabs"
                >
                  {selectedSystem.segments.map((segment, index) => (
                    <Tab
                      key={index}
                      label={segment.name}
                      {...a11yProps(index)}
                    />
                  ))}
                </Tabs>
                {selectedSystem.segments.map((segment, index) => (
                  <TabPanel key={index} value={tabValue} index={index}>
                    {renderChartComponent(selectedSystem.name, index)}
                  </TabPanel>
                ))}
              </Box>
            </CardContent>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
export default HideToolTipForGuest;
