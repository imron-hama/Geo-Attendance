import React, { useEffect, useRef } from 'react';

interface WorkplaceMapProps {
  userLat?: number;
  userLng?: number;
  workplaceLat: number;
  workplaceLng: number;
  radius: number;
}

declare const L: any;

export const WorkplaceMap: React.FC<WorkplaceMapProps> = ({ userLat, userLng, workplaceLat, workplaceLng, radius }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const workplaceCircle = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([workplaceLat, workplaceLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);
    }

    // Workplace Geofence
    if (workplaceCircle.current) {
      workplaceCircle.current.remove();
    }
    workplaceCircle.current = L.circle([workplaceLat, workplaceLng], {
      color: '#4f46e5',
      fillColor: '#4f46e5',
      fillOpacity: 0.2,
      radius: radius
    }).addTo(mapInstance.current);

    // User Marker
    if (userLat && userLng) {
      if (userMarker.current) {
        userMarker.current.setLatLng([userLat, userLng]);
      } else {
        userMarker.current = L.marker([userLat, userLng]).addTo(mapInstance.current)
          .bindPopup('Your Location')
          .openPopup();
      }
      
      // Auto zoom to fit both
      const group = new L.featureGroup([userMarker.current, workplaceCircle.current]);
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    } else {
      mapInstance.current.setView([workplaceLat, workplaceLng], 16);
    }

    return () => {
      // Cleanup not strictly necessary here as we reuse mapInstance
    };
  }, [userLat, userLng, workplaceLat, workplaceLng, radius]);

  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-inner mb-4">
      <div ref={mapRef} className="w-full h-full"></div>
    </div>
  );
};