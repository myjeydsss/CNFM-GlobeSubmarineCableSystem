# TanStack Query Implementation - Performance Improvements

## Overview
This document outlines the TanStack Query implementation that has been added to improve the performance of the CNFM (Cable Network Fault Management) application.

## What Was Implemented

### 1. QueryClient Setup (`src/App.tsx`)
- Added QueryClient provider at the app level
- Configured optimal settings for caching and retry logic
- Added React Query DevTools for development

### 2. Custom API Hooks (`src/hooks/useApi.ts`)
- **useDataSummary()**: Fetches cable data summary with automatic background refetching
- **useIpopUtilization()**: Fetches IPOP utilization data with real-time updates
- **useDeletedCables()**: Fetches deleted cables with smart caching based on lastUpdate
- **useLastUpdate()**: Fetches the latest update information
- **useDeleteCable()**: Mutation hook for deleting cables with automatic cache invalidation
- **useMarkerData()**: Generic hook for marker data (Singapore, Japan, etc.)

### 3. Updated Components

#### CableMap Component (`src/content/admin/components/CableMap.tsx`)
- Replaced manual fetch calls with TanStack Query hooks
- Eliminated useEffect-based polling in favor of automatic background refetching
- Added loading states and error handling
- Implemented optimistic updates for better user experience

#### DeletedCablesSidebar Component (`src/content/admin/components/DeletedCablesSidebar.tsx`)
- Replaced manual cable fetching with `useDeletedCables` hook
- Updated delete functionality to use mutation hooks
- Automatic cache invalidation when cables are deleted

#### SingaporeMarker Component (`src/content/admin/components/SingaporeMarker.tsx`)
- Replaced useEffect polling with TanStack Query
- Added automatic background updates every 5 minutes
- Improved error handling and loading states

## Performance Benefits

### 1. Intelligent Caching
- **Background Refetching**: Data is updated in the background without blocking the UI
- **Stale-While-Revalidate**: Shows cached data immediately while fetching fresh data
- **Intelligent Cache Invalidation**: Only refetches when necessary

### 2. Reduced Network Requests
- **Deduplication**: Multiple components requesting the same data share a single request
- **Cache Persistence**: Data persists across component mounts/unmounts
- **Smart Retry Logic**: Automatic retries with exponential backoff

### 3. Better User Experience
- **Loading States**: Proper loading indicators without blocking UI
- **Error Boundaries**: Graceful error handling and recovery
- **Optimistic Updates**: UI updates immediately for better perceived performance

### 4. Memory Management
- **Automatic Cleanup**: Unused queries are garbage collected
- **Request Cancellation**: Ongoing requests are cancelled when components unmount
- **No Memory Leaks**: Eliminates manual cleanup requirements

## Configuration Details

### Query Settings
```typescript
{
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,      // 10 minutes
  refetchInterval: 30 * 1000,   // 30 seconds (for real-time data)
  retry: 3,                     // Retry failed requests 3 times
  refetchOnWindowFocus: false,  // Don't refetch on window focus
  refetchOnReconnect: true,     // Refetch when connection is restored
}
```

### Data-Specific Configurations
- **Data Summary**: 30-second intervals for real-time dashboard updates
- **IPOP Utilization**: 30-second intervals for capacity monitoring
- **Deleted Cables**: 2-minute stale time with dependency on lastUpdate
- **Marker Data**: 5-minute intervals for location-based data

## Migration Benefits

### Before TanStack Query
- Manual useEffect-based data fetching
- Complex interval management and cleanup
- Race conditions and memory leaks
- No intelligent caching or deduplication
- Manual loading and error state management

### After TanStack Query
- Declarative data fetching with hooks
- Automatic background updates and caching
- Built-in loading and error states
- Request deduplication and optimization
- Automatic cleanup and memory management

## Development Tools

### React Query DevTools
- Available in development mode
- Inspect query states, cache, and network activity
- Debug performance issues and cache behavior
- Monitor background refetching and mutations

## Future Enhancements

### Possible Improvements
1. **Infinite Queries**: For paginated cable lists
2. **Optimistic Updates**: For faster perceived performance
3. **Offline Support**: Cache data for offline usage
4. **Real-time Subscriptions**: WebSocket integration for live updates
5. **Prefetching**: Preload data based on user behavior

### Performance Monitoring
- Monitor query performance with DevTools
- Track cache hit rates and network usage
- Measure improved user experience metrics
- A/B test different caching strategies

## Best Practices Implemented

1. **Centralized Query Keys**: Consistent key management for cache invalidation
2. **Error Boundaries**: Graceful error handling at component levels
3. **Loading States**: Proper user feedback during data fetching
4. **Mutation Callbacks**: Automatic cache updates after data modifications
5. **TypeScript Support**: Full type safety for all queries and mutations

## Conclusion

The TanStack Query implementation significantly improves the application's performance by:
- Reducing unnecessary network requests
- Providing better user experience with proper loading states
- Eliminating memory leaks and race conditions
- Enabling intelligent background data synchronization
- Simplifying component code and reducing complexity

This foundation enables future enhancements like real-time subscriptions, offline support, and advanced caching strategies.
