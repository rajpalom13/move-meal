'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from './maps/google-maps-provider';
import { Loader2 } from 'lucide-react';

interface RideMapProps {
  startPoint: {
    coordinates?: [number, number];
    address?: string;
  };
  endPoint: {
    coordinates?: [number, number];
    address?: string;
  };
  stops?: {
    coordinates?: [number, number];
    address?: string;
    userName?: string;
  }[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function RideMapGoogle({ startPoint, endPoint, stops = [] }: RideMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Calculate directions
  useEffect(() => {
    if (!isLoaded || !startPoint.coordinates || !endPoint.coordinates) return;

    const directionsService = new google.maps.DirectionsService();

    // Build waypoints from stops
    const waypoints = stops
      .filter(stop => stop.coordinates)
      .map(stop => ({
        location: { lat: stop.coordinates![1], lng: stop.coordinates![0] },
        stopover: true,
      }));

    directionsService.route(
      {
        origin: { lat: startPoint.coordinates[1], lng: startPoint.coordinates[0] },
        destination: { lat: endPoint.coordinates[1], lng: endPoint.coordinates[0] },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
        }
      }
    );
  }, [isLoaded, startPoint, endPoint, stops]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-ivory rounded-xl">
        <p className="text-charcoal">Failed to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-ivory rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-forest" />
      </div>
    );
  }

  if (!startPoint.coordinates || !endPoint.coordinates) {
    return (
      <div className="flex items-center justify-center h-full bg-ivory rounded-xl">
        <p className="text-charcoal">Location data not available</p>
      </div>
    );
  }

  const center = {
    lat: startPoint.coordinates[1],
    lng: startPoint.coordinates[0],
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {/* Show markers when directions haven't loaded yet */}
      {!directions && (
        <>
          {/* Start marker */}
          <Marker
            position={{ lat: startPoint.coordinates[1], lng: startPoint.coordinates[0] }}
            icon={{
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#22c55e" stroke="white" stroke-width="4"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
            title={`Start: ${startPoint.address}`}
          />

          {/* End marker */}
          <Marker
            position={{ lat: endPoint.coordinates[1], lng: endPoint.coordinates[0] }}
            icon={{
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="4"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
            title={`End: ${endPoint.address}`}
          />

          {/* Stop markers */}
          {stops.map((stop, index) =>
            stop.coordinates ? (
              <Marker
                key={index}
                position={{ lat: stop.coordinates[1], lng: stop.coordinates[0] }}
                icon={{
                  url: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="12" fill="#f97316" stroke="white" stroke-width="4"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16),
                }}
                title={`${stop.userName || 'Stop'}: ${stop.address}`}
              />
            ) : null
          )}
        </>
      )}

      {/* Directions route */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#516A4E',
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          }}
        />
      )}
    </GoogleMap>
  );
}
