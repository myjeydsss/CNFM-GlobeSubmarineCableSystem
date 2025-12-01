import React from 'react';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

const SimulationButton = () => {
  const map = useMap();

  useEffect(() => {
    // Remove default attribution control
    map.attributionControl.remove();

    // Create custom control
    const customControl = L.control({
      position: 'bottomright'
    });

    // Add the custom control to the map
    customControl.onAdd = function () {
      const container = L.DomUtil.create('div');

      // Use React DOM to create the button
      const renderButton = () => {
        // Create the container for the button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.borderRadius = '4px';
        buttonContainer.style.padding = '3px';

        // Create the actual button
        const button = document.createElement('button');
        button.innerHTML = `
          <span style="display: flex; align-items: center; justify-content: center; gap: 5px;">
            <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24">
              <path fill="currentColor" d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
            <span>Simulation Environment</span>
          </span>
        `;

        // Style the button like Material UI contained button
        button.style.backgroundColor = '#1976d2'; // Primary color
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.padding = '6px 16px';
        button.style.fontSize = '13px';
        button.style.fontWeight = '500';
        button.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
        button.style.textTransform = 'uppercase';
        button.style.cursor = 'pointer';
        button.style.boxShadow =
          '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)';

        // Add hover effect
        button.onmouseover = function () {
          button.style.backgroundColor = '#1565c0'; // Darker primary color
        };

        button.onmouseout = function () {
          button.style.backgroundColor = '#1976d2'; // Back to primary color
        };

        // Add click behavior
        button.onclick = function () {
          window.location.href = '/dashboard/simulation'; // Change this to your target URL
        };

        buttonContainer.appendChild(button);
        return buttonContainer;
      };

      container.appendChild(renderButton());
      return container;
    };

    customControl.addTo(map);

    return () => {
      map.removeControl(customControl);
    };
  }, [map]);

  // This component doesn't render anything directly
  return null;
};

export default SimulationButton;
