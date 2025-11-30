'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RideMapProps {
  startPoint: {
    coordinates: [number, number];
    address: string;
  };
  endPoint: {
    coordinates: [number, number];
    address: string;
  };
  stops?: {
    coordinates?: [number, number];
    address?: string;
    userName?: string;
  }[];
}

// Fix for default marker icons in Leaflet with webpack/Next.js
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const startIcon = createIcon('#22c55e'); // green
const endIcon = createIcon('#ef4444'); // red
const stopIcon = createIcon('#f97316'); // orange

export default function RideMap({ startPoint, endPoint, stops = [] }: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(
      [startPoint.coordinates[1], startPoint.coordinates[0]],
      13
    );

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add start marker
    L.marker([startPoint.coordinates[1], startPoint.coordinates[0]], { icon: startIcon })
      .addTo(map)
      .bindPopup(`<b>Start Point</b><br>${startPoint.address}`);

    // Add end marker
    L.marker([endPoint.coordinates[1], endPoint.coordinates[0]], { icon: endIcon })
      .addTo(map)
      .bindPopup(`<b>End Point</b><br>${endPoint.address}`);

    // Add stop markers
    stops.forEach((stop) => {
      if (stop.coordinates) {
        L.marker([stop.coordinates[1], stop.coordinates[0]], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<b>${stop.userName || 'Pickup'}</b><br>${stop.address || 'Pickup point'}`);
      }
    });

    // Create route line
    const routePoints: L.LatLngExpression[] = [
      [startPoint.coordinates[1], startPoint.coordinates[0]],
    ];

    // Add stops in order
    stops.forEach((stop) => {
      if (stop.coordinates) {
        routePoints.push([stop.coordinates[1], stop.coordinates[0]]);
      }
    });

    routePoints.push([endPoint.coordinates[1], endPoint.coordinates[0]]);

    // Draw the route
    L.polyline(routePoints, {
      color: '#f97316',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10',
    }).addTo(map);

    // Fit bounds to show all markers
    const bounds = L.latLngBounds([
      [startPoint.coordinates[1], startPoint.coordinates[0]],
      [endPoint.coordinates[1], endPoint.coordinates[0]],
      ...stops
        .filter((s) => s.coordinates)
        .map((s) => [s.coordinates![1], s.coordinates![0]] as L.LatLngTuple),
    ]);

    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [startPoint, endPoint, stops]);

  return (
    <div ref={mapRef} className="w-full h-full" style={{ minHeight: '300px' }}>
      {/* Map will be rendered here */}
    </div>
  );
}
