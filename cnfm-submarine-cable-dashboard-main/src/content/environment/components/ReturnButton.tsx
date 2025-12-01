import React from 'react';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

const ReturnButton = () => {
  const map = useMap();
  const navigate = useNavigate();

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
              <path fill="currentColor" d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span>Exit Simulation</span>
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
          localStorage.removeItem('seausCableCuts'); // Clear simulation data
          navigate(-1);
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

export default ReturnButton;
