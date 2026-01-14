import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import 'nprogress/nprogress.css';
import App from 'src/App';
import { SidebarProvider } from 'src/contexts/SidebarContext';
import * as serviceWorker from 'src/serviceWorker';

// Global style to remove default focus outline on Leaflet containers (affects all maps, including guest views)
if (
  typeof document !== 'undefined' &&
  !document.getElementById('leaflet-outline-reset')
) {
  const style = document.createElement('style');
  style.id = 'leaflet-outline-reset';
  style.innerHTML = `
    /* Remove focus outlines on map, layers, and interactive SVGs for all views (guest + admin) */
    .leaflet-container:focus,
    .leaflet-pane:focus,
    .leaflet-overlay-pane:focus,
    .leaflet-marker-icon:focus,
    .leaflet-popup:focus,
    .leaflet-tooltip:focus,
    .leaflet-interactive:focus,
    .leaflet-interactive {
      outline: none !important;
    }
  `;
  document.head.appendChild(style);
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <HelmetProvider>
    <SidebarProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SidebarProvider>
  </HelmetProvider>
);

serviceWorker.unregister();
