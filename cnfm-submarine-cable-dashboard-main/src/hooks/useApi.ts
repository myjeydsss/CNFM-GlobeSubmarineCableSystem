import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// Types
interface DataSummaryItem {
  gbps: number;
  percent: number;
}

interface DataSummaryStats {
  data: DataSummaryItem[];
  totalGbps: number;
  avgUtilization: number;
  zeroUtilizationCount: number;
}

interface IpopUtilizationData {
  current: Array<{ a_side: string }>;
  previous: Array<{ a_side: string }>;
}

interface IpopUtilizationResult {
  utilization: string;
  difference: string;
}

export interface CableCut {
  cut_id: string;
  cut_type: string;
  cable_type?: string;
  fault_date: string;
  distance: number;
  simulated: string;
  latitude: number;
  longitude: number;
  depth: number;
}

// API Configuration
const getApiConfig = () => ({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost',
  port: process.env.REACT_APP_PORT || ':8081',
});

// Query Keys - centralized for consistency
export const queryKeys = {
  dataSummary: ['dataSummary'] as const,
  ipopUtilization: ['ipopUtilization'] as const,
  deletedCables: ['deletedCables'] as const,
  lastUpdate: ['lastUpdate'] as const,
  singaporeMarker: ['singaporeMarker'] as const,
  japanMarker: ['japanMarker'] as const,
  hongkongMarker: ['hongkongMarker'] as const,
  usaMarker: ['usaMarker'] as const,
} as const;

// Fetch functions
const fetchDataSummary = async (): Promise<DataSummaryStats> => {
  const { baseUrl, port } = getApiConfig();
  const response = await fetch(`${baseUrl}${port}/data-summary`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data summary: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!Array.isArray(result) || result.length === 0) {
    return { data: [], totalGbps: 0, avgUtilization: 0, zeroUtilizationCount: 0 };
  }
  
  const totalGbps = result.reduce((sum, item) => sum + (item.gbps || 0), 0);
  const totalUtilization = result.reduce((sum, item) => sum + (item.percent || 0), 0);
  const avgUtilization = parseFloat((totalUtilization / result.length).toFixed(2));
  const zeroUtilizationCount = result.filter((item) => item.percent === 0).length;
  
  return { data: result, totalGbps, avgUtilization, zeroUtilizationCount };
};

const fetchIpopUtilization = async (): Promise<IpopUtilizationResult> => {
  const { baseUrl, port } = getApiConfig();
  const response = await fetch(`${baseUrl}${port}/average-util`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch IPOP utilization: ${response.status}`);
  }
  
  const data: IpopUtilizationData = await response.json();
  
  if (!data?.current?.length) {
    return { utilization: '0%', difference: '' };
  }
  
  const currentVal = parseFloat(data.current[0].a_side);
  const utilization = `${currentVal}%`;
  
  let difference = '';
  if (data?.previous?.length) {
    const previousVal = parseFloat(data.previous[0].a_side);
    const diff = currentVal - previousVal;
    const sign = diff > 0 ? '+' : '';
    difference = `${sign}${diff.toFixed(2)}%`;
  }
  
  return { utilization, difference };
};

const fetchDeletedCables = async (): Promise<CableCut[]> => {
  const { baseUrl, port } = getApiConfig();
  const response = await fetch(`${baseUrl}${port}/fetch-cable-cuts`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch deleted cables: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!Array.isArray(result)) {
    return [];
  }
  
  // Sort by fault_date in descending order (newest first)
  const sortedData = [...result].sort((a, b) => {
    const dateA = a.fault_date ? new Date(a.fault_date) : new Date(0);
    const dateB = b.fault_date ? new Date(b.fault_date) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sortedData;
};

const fetchLastUpdate = async (): Promise<string> => {
  const { baseUrl, port } = getApiConfig();
  const response = await fetch(`${baseUrl}${port}/latest-update`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch last update: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data?.update?.date_time) {
    const fileName = data.update.file_name;
    return fileName ? fileName.replace(/\.csv$/i, '') : fileName || '';
  }
  
  return '';
};


// Custom Hooks
export const useDataSummary = () => {
  return useQuery({
    queryKey: queryKeys.dataSummary,
    queryFn: fetchDataSummary,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

export const useIpopUtilization = () => {
  return useQuery({
    queryKey: queryKeys.ipopUtilization,
    queryFn: fetchIpopUtilization,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

export const useDeletedCables = (lastUpdate?: string) => {
  return useQuery({
    queryKey: [...queryKeys.deletedCables, lastUpdate],
    queryFn: fetchDeletedCables,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};

export const useLastUpdate = () => {
  return useQuery({
    queryKey: queryKeys.lastUpdate,
    queryFn: fetchLastUpdate,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
  });
};

// Mutation for deleting cables
export const useDeleteCable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cableId: string) => {
      const { baseUrl, port } = getApiConfig();
      const response = await fetch(
        `${baseUrl}${port}/delete-single-cable-cuts/${cableId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to delete cable: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch deleted cables and last update
      queryClient.invalidateQueries({ queryKey: queryKeys.deletedCables });
      queryClient.invalidateQueries({ queryKey: queryKeys.lastUpdate });
    },
    onError: (error) => {
      console.error('Error deleting cable:', error);
    },
  });
};

// Generic marker data hook (can be used for different markers)
export const useMarkerData = (endpoint: string, queryKey: readonly string[]) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { baseUrl, port } = getApiConfig();
      const response = await fetch(`${baseUrl}${port}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch marker data: ${response.status}`);
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
};

// Specific marker hooks
export const useSingaporeMarkerData = () => 
  useMarkerData('/singapore-marker', queryKeys.singaporeMarker);

export const useJapanMarkerData = () => 
  useMarkerData('/japan-marker', queryKeys.japanMarker);

export const useHongkongMarkerData = () => 
  useMarkerData('/hongkong-marker', queryKeys.hongkongMarker);

export const useUSAMarkerData = () => 
  useMarkerData('/usa-marker', queryKeys.usaMarker);

// Utility hook for invalidating all queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);
};

// Hook for prefetching data
export const usePrefetchData = () => {
  const queryClient = useQueryClient();
  
  const prefetchDataSummary = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dataSummary,
      queryFn: fetchDataSummary,
      staleTime: 30 * 1000,
    });
  }, [queryClient]);
  
  const prefetchIpopUtilization = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ipopUtilization,
      queryFn: fetchIpopUtilization,
      staleTime: 30 * 1000,
    });
  }, [queryClient]);
  
  return { prefetchDataSummary, prefetchIpopUtilization };
};
