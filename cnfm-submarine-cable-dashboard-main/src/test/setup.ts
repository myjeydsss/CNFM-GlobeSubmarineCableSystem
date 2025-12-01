import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Global test setup

// Mock Leaflet globally since it's used in multiple components
beforeAll(() => {
  // Mock Leaflet
  global.L = {
    map: () => ({
      setView: () => ({}),
      addLayer: () => ({}),
      removeLayer: () => ({}),
      hasLayer: () => false,
      on: () => ({}),
      off: () => ({}),
      remove: () => ({}),
    }),
    tileLayer: () => ({
      addTo: () => ({}),
    }),
    marker: () => ({
      addTo: () => ({}),
      bindPopup: () => ({}),
      openPopup: () => ({}),
      setLatLng: () => ({}),
      on: () => ({}),
      off: () => ({}),
    }),
    popup: () => ({
      setContent: () => ({}),
      openOn: () => ({}),
    }),
    icon: () => ({}),
    divIcon: () => ({}),
    latLng: () => ({}),
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
