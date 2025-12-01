import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import CableMap from './CableMap';
import * as useApiHooks from '../../../hooks/useApi';

// Mock Leaflet
const mockPane = {
  style: { zIndex: '650' }
};

const mockMap = {
  setView: vi.fn(),
  getPane: vi.fn(() => mockPane),
  createPane: vi.fn(() => mockPane),
  removeLayer: vi.fn(),
  addTo: vi.fn(),
  attributionControl: {
    remove: vi.fn()
  }
};

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: ({ url }: any) => <div data-testid="tile-layer" data-url={url} />,
  Marker: ({ children, position }: any) => (
    <div data-testid="marker" data-position={position?.join(',')}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => mockMap
}));

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    marker: vi.fn(() => ({
      bindTooltip: vi.fn(),
      addTo: vi.fn(),
      remove: vi.fn()
    })),
    circleMarker: vi.fn(() => ({
      bindTooltip: vi.fn(),
      addTo: vi.fn(),
      remove: vi.fn()
    })),
    Icon: vi.fn()
  }
}));

// Mock all the dashboard components
vi.mock('../dashboard/SeaUS', () => ({
  default: () => <div data-testid="sea-us-component" />
}));

vi.mock('../dashboard/SJC', () => ({
  default: () => <div data-testid="sjc-component" />
}));

vi.mock('../dashboard/C2C', () => ({
  default: () => <div data-testid="c2c-component" />
}));

vi.mock('../dashboard/TGNIA', () => ({
  default: () => <div data-testid="tgnia-component" />
}));

// Mock marker components
vi.mock('./JapanMarker', () => ({
  default: () => <div data-testid="japan-marker" />
}));

vi.mock('./HongkongMarker', () => ({
  default: () => <div data-testid="hongkong-marker" />
}));

vi.mock('./SingaporeMarker', () => ({
  default: () => <div data-testid="singapore-marker" />
}));

vi.mock('./USAMarker', () => ({
  default: () => <div data-testid="usa-marker" />
}));

// Mock route position list components
vi.mock('../dashboard/RoutePositionList/RPLSeaUS1', () => ({
  default: () => <div data-testid="rplsea-us1-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSeaUS2', () => ({
  default: () => <div data-testid="rplsea-us2-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSeaUS3', () => ({
  default: () => <div data-testid="rplsea-us3-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSeaUS4', () => ({
  default: () => <div data-testid="rplsea-us4-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSeaUS5', () => ({
  default: () => <div data-testid="rplsea-us5-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSeaUS6', () => ({
  default: () => <div data-testid="rplsea-us6-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC1', () => ({
  default: () => <div data-testid="rplsjc1-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC3', () => ({
  default: () => <div data-testid="rplsjc3-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC4', () => ({
  default: () => <div data-testid="rplsjc4-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC5', () => ({
  default: () => <div data-testid="rplsjc5-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC6', () => ({
  default: () => <div data-testid="rplsjc6-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC7', () => ({
  default: () => <div data-testid="rplsjc7-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC8', () => ({
  default: () => <div data-testid="rplsjc8-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC9', () => ({
  default: () => <div data-testid="rplsjc9-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC10', () => ({
  default: () => <div data-testid="rplsjc10-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC11', () => ({
  default: () => <div data-testid="rplsjc11-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC12', () => ({
  default: () => <div data-testid="rplsjc12-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLSJC13', () => ({
  default: () => <div data-testid="rplsjc13-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA1', () => ({
  default: () => <div data-testid="rpltgnia1-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA2', () => ({
  default: () => <div data-testid="rpltgnia2-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA3', () => ({
  default: () => <div data-testid="rpltgnia3-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA4', () => ({
  default: () => <div data-testid="rpltgnia4-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA5', () => ({
  default: () => <div data-testid="rpltgnia5-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA6', () => ({
  default: () => <div data-testid="rpltgnia6-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA7', () => ({
  default: () => <div data-testid="rpltgnia7-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA8', () => ({
  default: () => <div data-testid="rpltgnia8-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA9', () => ({
  default: () => <div data-testid="rpltgnia9-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA10', () => ({
  default: () => <div data-testid="rpltgnia10-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA11', () => ({
  default: () => <div data-testid="rpltgnia11-component" />
}));
vi.mock('../dashboard/RoutePositionList/RPLTGNIA12', () => ({
  default: () => <div data-testid="rpltgnia12-component" />
}));

// Mock sidebar components
vi.mock('./DeletedCablesSidebar', () => ({
  default: ({ onSelectCable, onCloseSidebar, isAdmin, isUser }: any) => (
    <div data-testid="deleted-cables-sidebar">
      <div data-testid="sidebar-admin">{isAdmin.toString()}</div>
      <div data-testid="sidebar-user">{isUser.toString()}</div>
      <button 
        data-testid="select-cable-btn" 
        onClick={() => onSelectCable({ cut_id: 'test-cable-1' })}
      >
        Select Cable
      </button>
      <button 
        data-testid="close-sidebar-btn" 
        onClick={onCloseSidebar}
      >
        Close Sidebar
      </button>
    </div>
  )
}));

vi.mock('./HideToolTip', () => ({
  default: () => <div data-testid="hide-tooltip" />
}));

vi.mock('src/content/environment/components/SimulationButton', () => ({
  default: () => <div data-testid="simulation-button" />
}));

vi.mock('../../environment/components/SimulationButton', () => ({
  default: () => <div data-testid="simulation-button" />
}));

// Mock CSS import
vi.mock('leaflet/dist/leaflet.css', () => ({}));

describe('CableMap Component', () => {
  let queryClient: QueryClient;
  
  const mockStatsData = {
    data: [
      { gbps: 1000, percent: 75 },
      { gbps: 1500, percent: 85 }
    ],
    totalGbps: 2500,
    avgUtilization: 80,
    zeroUtilizationCount: 0
  };

  const mockIpopData = {
    utilization: '80.5%',
    difference: '+2.3%'
  };

  const mockSelectedCable = {
    cut_id: 'TEST-001',
    latitude: 35.6762,
    longitude: 139.6503,
    distance: 1500,
    fault_date: '2024-01-15',
    depth: 2000,
    cable_type: 'Fiber Optic',
    cut_type: 'BREAK'
  };

  // Helper function to create complete query mock
  const createQueryMock = (data: any, overrides: any = {}) => ({
    data,
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isSuccess: true,
    isLoadingError: false,
    isRefetchError: false,
    status: 'success' as const,
    fetchStatus: 'idle' as const,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    isInitialLoading: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isStale: false,
    remove: vi.fn(),
    ...overrides
  });

  // Helper function to create complete mutation mock
  const createMutationMock = (overrides: any = {}) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    reset: vi.fn(),
    isIdle: true,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    status: 'idle' as const,
    submittedAt: 0,
    variables: undefined,
    context: undefined,
    ...overrides
  });

  // Default mock implementations
  const defaultMocks = {
    useDataSummary: createQueryMock(mockStatsData),
    useIpopUtilization: createQueryMock(mockIpopData),
    useLastUpdate: createQueryMock('2024-01-15T10:30:00Z'),
    useDeleteCable: createMutationMock(),
    usePrefetchData: {
      prefetchDataSummary: vi.fn(),
      prefetchIpopUtilization: vi.fn()
    }
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks to default implementations
    Object.entries(defaultMocks).forEach(([hookName, mockImpl]) => {
      vi.spyOn(useApiHooks, hookName as any).mockReturnValue(mockImpl);
    });

    // Mock environment variables
    vi.stubEnv('REACT_APP_API_BASE_URL', 'http://localhost');
    vi.stubEnv('REACT_APP_PORT', ':8081');
    vi.stubEnv('REACT_APP_GEOAPIFY_API_KEY', 'test-api-key');

    // Mock window methods
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    // Mock global alert and confirm
    global.alert = vi.fn();
    global.confirm = vi.fn().mockReturnValue(true);

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  const renderCableMap = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CableMap {...props} />
      </QueryClientProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('renders the map container successfully', () => {
      renderCableMap();
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    });

    it('displays capacity and utilization stats', () => {
      renderCableMap();
      
      expect(screen.getByText('Capacity:')).toBeInTheDocument();
      expect(screen.getByText('2500 Gbps')).toBeInTheDocument();
      expect(screen.getByText('Average Utilization:')).toBeInTheDocument();
      expect(screen.getByText('80.5%')).toBeInTheDocument();
    });

    it('renders sidebar toggle buttons', () => {
      renderCableMap();
      
      const leftToggle = screen.getByLabelText('Show Deleted Cables Sidebar');
      const rightToggle = screen.getByLabelText('Show Info Sidebar');
      
      expect(leftToggle).toBeInTheDocument();
      expect(rightToggle).toBeInTheDocument();
    });

    it('renders all marker components', () => {
      renderCableMap();
      
      expect(screen.getByTestId('japan-marker')).toBeInTheDocument();
      expect(screen.getByTestId('hongkong-marker')).toBeInTheDocument();
      expect(screen.getByTestId('singapore-marker')).toBeInTheDocument();
      expect(screen.getByTestId('usa-marker')).toBeInTheDocument();
    });

    it('renders route position list components', () => {
      renderCableMap();
      
      // Test a few key RPL components
      expect(screen.getByTestId('rplsea-us1-component')).toBeInTheDocument();
      expect(screen.getByTestId('rplsjc1-component')).toBeInTheDocument();
      expect(screen.getByTestId('rpltgnia1-component')).toBeInTheDocument();
    });
  });

  describe('Sidebar Functionality', () => {
    it('opens and closes left sidebar correctly', async () => {
      renderCableMap();
      
      const leftToggle = screen.getByLabelText('Show Deleted Cables Sidebar');
      
      // Initially closed
      expect(screen.queryByTestId('deleted-cables-sidebar')).not.toBeInTheDocument();
      
      // Open sidebar
      fireEvent.click(leftToggle);
      await waitFor(() => {
        expect(screen.getByTestId('deleted-cables-sidebar')).toBeInTheDocument();
      });
      
      // Close sidebar using toggle
      fireEvent.click(leftToggle);
      await waitFor(() => {
        expect(screen.queryByTestId('deleted-cables-sidebar')).not.toBeInTheDocument();
      });
    });

    it('opens and closes right sidebar correctly', async () => {
      renderCableMap();
      
      const rightToggle = screen.getByLabelText('Show Info Sidebar');
      
      // Initially closed
      expect(screen.queryByTestId('hide-tooltip')).not.toBeInTheDocument();
      
      // Open sidebar
      fireEvent.click(rightToggle);
      await waitFor(() => {
        expect(screen.getByTestId('hide-tooltip')).toBeInTheDocument();
      });
      
      // Close sidebar
      fireEvent.click(rightToggle);
      await waitFor(() => {
        expect(screen.queryByTestId('hide-tooltip')).not.toBeInTheDocument();
      });
    });

    it('passes correct props to DeletedCablesSidebar', async () => {
      const mockSetLastUpdate = vi.fn();
      const mockMapRef = { current: mockMap };
      
      renderCableMap({ 
        setLastUpdate: mockSetLastUpdate, 
        mapRef: mockMapRef 
      });
      
      // Open sidebar
      const leftToggle = screen.getByLabelText('Show Deleted Cables Sidebar');
      fireEvent.click(leftToggle);
      
      await waitFor(() => {
        expect(screen.getByTestId('sidebar-admin')).toHaveTextContent('true');
        expect(screen.getByTestId('sidebar-user')).toHaveTextContent('true');
      });
    });

    it('handles sidebar close callback', async () => {
      renderCableMap();
      
      // Open sidebar
      const leftToggle = screen.getByLabelText('Show Deleted Cables Sidebar');
      fireEvent.click(leftToggle);
      
      await waitFor(() => {
        expect(screen.getByTestId('deleted-cables-sidebar')).toBeInTheDocument();
      });
      
      // Close using sidebar's close button
      const closeBtn = screen.getByTestId('close-sidebar-btn');
      fireEvent.click(closeBtn);
      
      await waitFor(() => {
        expect(screen.queryByTestId('deleted-cables-sidebar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Selected Cable Popup', () => {
    it('renders cable popup when selectedCable and selectedCutType are provided', () => {
      renderCableMap({
        selectedCable: mockSelectedCable,
        selectedCutType: 'BREAK'
      });
      
      expect(screen.getByTestId('marker')).toBeInTheDocument();
      expect(screen.getByTestId('popup')).toBeInTheDocument();
      expect(screen.getByText('BREAK')).toBeInTheDocument();
      expect(screen.getByText(/TEST-001/)).toBeInTheDocument();
      expect(screen.getByText(/1500 km/)).toBeInTheDocument();
    });

    it('displays all cable details in popup', () => {
      renderCableMap({
        selectedCable: mockSelectedCable,
        selectedCutType: 'BREAK'
      });
      
      expect(screen.getByText(/Depth: 2000m/)).toBeInTheDocument();
      expect(screen.getByText(/Cut Type: BREAK/)).toBeInTheDocument();
      expect(screen.getByText(/Cable Type: Fiber Optic/)).toBeInTheDocument();
      expect(screen.getByText(/Latitude: 35.6762/)).toBeInTheDocument();
      expect(screen.getByText(/Longitude: 139.6503/)).toBeInTheDocument();
    });

    it('handles cable deletion successfully', async () => {
      const mockOnCloseCablePopup = vi.fn();
      const mockSetLastUpdate = vi.fn();
      
      renderCableMap({
        selectedCable: mockSelectedCable,
        selectedCutType: 'BREAK',
        onCloseCablePopup: mockOnCloseCablePopup,
        setLastUpdate: mockSetLastUpdate
      });
      
      const deleteBtn = screen.getByText('Delete');
      
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      
      await waitFor(() => {
        expect(defaultMocks.useDeleteCable.mutateAsync).toHaveBeenCalledWith('TEST-001');
        expect(global.alert).toHaveBeenCalledWith('Cable deleted successfully!');
        expect(mockOnCloseCablePopup).toHaveBeenCalled();
        expect(mockSetLastUpdate).toHaveBeenCalled();
      });
    });

    it('handles cable deletion failure', async () => {
      // Mock deletion failure
      vi.spyOn(useApiHooks, 'useDeleteCable').mockReturnValue(
        createMutationMock({
          mutateAsync: vi.fn().mockResolvedValue({ success: false, message: 'Server error' })
        })
      );
      
      renderCableMap({
        selectedCable: mockSelectedCable,
        selectedCutType: 'BREAK'
      });
      
      const deleteBtn = screen.getByText('Delete');
      
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to delete cable: Server error');
      });
    });

    it('handles delete button confirmation dialog', async () => {
      global.confirm = vi.fn().mockReturnValue(false);
      
      renderCableMap({
        selectedCable: mockSelectedCable,
        selectedCutType: 'BREAK'
      });
      
      const deleteBtn = screen.getByText('Delete');
      
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete cable TEST-001?');
      expect(defaultMocks.useDeleteCable.mutateAsync).not.toHaveBeenCalled();
    });

    it('handles popup close button', () => {
      const mockOnCloseCablePopup = vi.fn();
      
      renderCableMap({
        selectedCable: mockSelectedCable,
        selectedCutType: 'BREAK',
        onCloseCablePopup: mockOnCloseCablePopup
      });
      
      const closeBtn = screen.getByText('Close');
      fireEvent.click(closeBtn);
      
      expect(mockOnCloseCablePopup).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('displays loading overlay when data is loading', () => {
      vi.spyOn(useApiHooks, 'useDataSummary').mockReturnValue(
        createQueryMock(null, {
          isLoading: true,
          isSuccess: false,
          status: 'pending' as const
        })
      );
      
      renderCableMap();
      
      expect(screen.getByText('Loading map data...')).toBeInTheDocument();
    });

    it('hides loading overlay when data is loaded', () => {
      renderCableMap();
      
      expect(screen.queryByText('Loading map data...')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', () => {
      vi.spyOn(useApiHooks, 'useDataSummary').mockReturnValue(
        createQueryMock(null, {
          isError: true,
          error: new Error('API Error'),
          isSuccess: false,
          status: 'error' as const
        })
      );
      
      // Should not crash and still render the map
      renderCableMap();
      
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('displays fallback data when API returns empty data', () => {
      vi.spyOn(useApiHooks, 'useDataSummary').mockReturnValue(
        createQueryMock(null)
      );
      
      vi.spyOn(useApiHooks, 'useIpopUtilization').mockReturnValue(
        createQueryMock(null)
      );
      
      renderCableMap();
      
      expect(screen.getByText('0 Gbps')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Map Height Calculation', () => {
    it('responds to window resize events', async () => {
      renderCableMap();
      
      // Verify that the resize event handler is attached and component renders correctly
      const initialMapContainer = screen.getByTestId('map-container');
      expect(initialMapContainer).toBeInTheDocument();
      
      // Trigger resize events to ensure no errors
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      window.dispatchEvent(new Event('resize'));
      
      Object.defineProperty(window, 'innerWidth', { value: 1400 });
      window.dispatchEvent(new Event('resize'));
      
      Object.defineProperty(window, 'innerWidth', { value: 1000 });
      window.dispatchEvent(new Event('resize'));
      
      // Verify map still renders after resize events
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Data Prefetching', () => {
    it('prefetches data on component mount', () => {
      renderCableMap();
      
      expect(defaultMocks.usePrefetchData.prefetchDataSummary).toHaveBeenCalled();
      expect(defaultMocks.usePrefetchData.prefetchIpopUtilization).toHaveBeenCalled();
    });
  });

  describe('Props Integration', () => {
    it('syncs external lastUpdate prop with query result', () => {
      const mockSetLastUpdate = vi.fn();
      
      renderCableMap({ setLastUpdate: mockSetLastUpdate });
      
      expect(mockSetLastUpdate).toHaveBeenCalledWith('2024-01-15T10:30:00Z');
    });

    it('uses external mapRef when provided', () => {
      const mockMapRef = { current: mockMap };
      
      renderCableMap({ mapRef: mockMapRef });
      
      // Map should render successfully with external ref
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats date strings correctly', () => {
      renderCableMap({
        selectedCable: {
          ...mockSelectedCable,
          fault_date: '2024-01-15T10:30:00Z'
        },
        selectedCutType: 'BREAK'
      });
      
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });

    it('handles invalid date strings gracefully', () => {
      renderCableMap({
        selectedCable: {
          ...mockSelectedCable,
          fault_date: 'invalid-date'
        },
        selectedCutType: 'BREAK'
      });
      
      expect(screen.getByText(/invalid-date/)).toBeInTheDocument();
    });
  });
});
