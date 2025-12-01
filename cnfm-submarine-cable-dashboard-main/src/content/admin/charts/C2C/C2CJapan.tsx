import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { styled, useTheme } from '@mui/material/styles';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CardHeader,
  Divider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Speed } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BarChartIcon from '@mui/icons-material/BarChart';

const AvatarPrimary = styled(Avatar)(
  ({ theme }) => `
      background: ${theme.colors.primary.lighter};
      color: ${theme.colors.primary.main};
      width: ${theme.spacing(8)};
      height: ${theme.spacing(8)};
`
);

interface C2CJapanLink {
  site: string;
  cable: string;
  globe_circuit_id: string;
  link: string;
  gbps_capacity: number;
  percent_utilization: number;
  remarks: string;
}

const C2CJapan: React.FC = () => {
  const theme = useTheme();
  const [openChart, setOpenChart] = useState(false);
  // ✅ Combine all related state values into one object
  const [stats, setStats] = useState({
    data: [],
    totalGbps: 0,
    avgUtilization: 0,
    zeroUtilizationCount: 0
  });
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;

  useEffect(() => {
    let interval;
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${port}/c2c-japan`);
        const result = await response.json();

        if (Array.isArray(result)) {
          const totalGbps = result.reduce(
            (sum, item) => sum + (item.gbps_capacity || 0),
            0
          );

          const totalUtilization = result.reduce(
            (sum, item) => sum + (item.percent_utilization || 0),
            0
          );

          const avgUtilization =
            result.length > 0
              ? parseFloat((totalUtilization / result.length).toFixed(2))
              : 0;

          const zeroCount = result.filter(
            (item) => item.percent_utilization === 0
          ).length;

          // ✅ Set all state values in a single update
          setStats((prev) => ({
            ...prev,
            data: result,
            totalGbps,
            avgUtilization,
            zeroUtilizationCount: zeroCount
          }));
        } else {
          console.error('Unexpected API response format:', result);
        }
      } catch (err) {
        console.log(err);
      }
    };
    // Initial fetch
    fetchData();

    // Only set interval if we don't have data yet
    if (!stats.data) {
      interval = setInterval(fetchData, 2000);
    }

    return () => clearInterval(interval);
  }, []); // ✅ Runs only once on mount

  //Chart Data and Styling
  const labels = stats.data.map((item) => item.link);
  const chartData = stats.data.map((item) => item.percent_utilization);
  const zeroCount = stats.data.filter(
    (item) => item.percent_utilization === 0
  ).length;
  const adjustedChartData = chartData.map((val) => (val === 0 ? 1 : val)); // Ensure bars have a small value

  const chartOptions: ApexOptions = {
    chart: {
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    fill: { opacity: 0.9 },
    colors: chartData.map(
      (val) =>
        val === 0 ? theme.palette.primary.main : theme.palette.primary.main // Light gray for 0% instead of fully hidden
    ),
    dataLabels: { enabled: false },
    theme: { mode: theme.palette.mode },
    stroke: { show: true, width: 3 },
    legend: { show: false },
    plotOptions: {
      bar: {
        horizontal: false, // Keep bars vertical
        columnWidth: '60%', // Reduce gaps between bars
        barHeight: '90%', // Ensure small bars stay visible
        borderRadius: 4
      }
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          fontSize: '12px',
          colors: labels.map((_, index) =>
            chartData[index] === 0 ? 'red' : theme.palette.text.primary
          )
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: { text: 'Utilization (%)' },
      max: 100 // Always set the max to 100%
    },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex }) => {
        if (!stats.data || dataPointIndex >= stats.data.length) return null;

        const gbpsCapacity = stats.data[dataPointIndex]?.gbps_capacity ?? 'N/A';
        const remark = stats.data[dataPointIndex]?.remarks?.trim();
        const utilization = adjustedChartData[dataPointIndex]; // Use adjusted data for correct value

        const remarkSection = remark
          ? `<div style="color: red;"><strong>${remark}</strong><br></div>`
          : '';

        return `
        <div style="padding: 10px; font-size: 12px;">
          ${remarkSection}
          Utilization: ${
            chartData[dataPointIndex] === 0 ? '0' : utilization
          }%<br> 
          Capacity: ${gbpsCapacity} Gbps
        </div>
      `;
      }
    }
  };

  return (
    <>
      <CardHeader title="Nasugbu-Japan Link" />
      <Divider />
      <Box
        py={2}
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <AvatarPrimary>
          <Speed />
        </AvatarPrimary>
        <Box>
          <Typography
            gutterBottom
            variant="subtitle1"
            sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
          >
            Gbps Total Capacity
          </Typography>
          <Typography variant="h3">{stats.totalGbps}</Typography>
        </Box>
        <Box>
          <Typography
            gutterBottom
            variant="subtitle1"
            sx={{ fontSize: `${theme.typography.pxToRem(16)}` }}
          >
            Average Utilization
          </Typography>
          <Typography variant="h3">{stats.avgUtilization}%</Typography>
        </Box>
      </Box>

      {/* Button to Open Chart Dialog */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
        <Badge badgeContent={zeroCount} color="error">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenChart(true)}
            startIcon={<BarChartIcon />}
          >
            Individual Link Utilization
          </Button>
        </Badge>
      </Box>

      {/* Dialog Modal for Chart */}
      <Dialog
        open={openChart}
        onClose={() => setOpenChart(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">Nasugbu-Japan Utilization Chart</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Chart
              options={chartOptions}
              series={[{ name: '', data: adjustedChartData }]}
              type="bar"
              height={400}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChart(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default C2CJapan;
