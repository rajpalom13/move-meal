'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from './google-maps-provider';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerMapProps {
  startLocation?: Location | null;
  endLocation?: Location | null;
  stops?: Location[];
  onStartChange?: (location: Location) => void;
  onEndChange?: (location: Location) => void;
  onStopsChange?: (stops: Location[]) => void;
  mode?: 'single' | 'route' | 'route-with-stops';
  onLocationSelect?: (location: Location) => void;
  currentLocation?: { lat: number; lng: number } | null;
  height?: string;
  showCurrentLocationButton?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 28.6139, // Delhi
  lng: 77.209,
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

export default function LocationPickerMap({
  startLocation,
  endLocation,
  stops = [],
  onStartChange,
  onEndChange,
  onStopsChange,
  mode = 'single',
  onLocationSelect,
  currentLocation,
  height = '300px',
  showCurrentLocationButton = true,
}: LocationPickerMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Get address from coordinates
  const getAddressFromCoords = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (!isLoaded) return '';

    const geocoder = new google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return '';
  }, [isLoaded]);

  // Handle map click
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const address = await getAddressFromCoords(lat, lng);
    const location = { lat, lng, address };

    if (mode === 'single' && onLocationSelect) {
      onLocationSelect(location);
    } else if (mode === 'route' || mode === 'route-with-stops') {
      if (!startLocation && onStartChange) {
        onStartChange(location);
      } else if (!endLocation && onEndChange) {
        onEndChange(location);
      } else if (mode === 'route-with-stops' && onStopsChange) {
        onStopsChange([...stops, location]);
      }
    }
  }, [mode, startLocation, endLocation, stops, onStartChange, onEndChange, onStopsChange, onLocationSelect, getAddressFromCoords]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await getAddressFromCoords(lat, lng);
        const location = { lat, lng, address };

        if (mode === 'single' && onLocationSelect) {
          onLocationSelect(location);
        } else if (onStartChange && !startLocation) {
          onStartChange(location);
        }

        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
      }
    );
  }, [mode, startLocation, onStartChange, onLocationSelect, getAddressFromCoords]);

  // Calculate directions when start and end are set
  useEffect(() => {
    if (!isLoaded || mode === 'single') return;
    if (!startLocation || !endLocation) {
      setDirections(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    const waypoints = stops.map(stop => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin: { lat: startLocation.lat, lng: startLocation.lng },
        destination: { lat: endLocation.lat, lng: endLocation.lng },
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
  }, [isLoaded, mode, startLocation, endLocation, stops]);

  // Fit bounds to markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (startLocation) {
      bounds.extend({ lat: startLocation.lat, lng: startLocation.lng });
      hasPoints = true;
    }
    if (endLocation) {
      bounds.extend({ lat: endLocation.lat, lng: endLocation.lng });
      hasPoints = true;
    }
    stops.forEach(stop => {
      bounds.extend({ lat: stop.lat, lng: stop.lng });
      hasPoints = true;
    });
    if (currentLocation) {
      bounds.extend(currentLocation);
      hasPoints = true;
    }

    if (hasPoints) {
      mapRef.current.fitBounds(bounds, 50);
    }
  }, [isLoaded, startLocation, endLocation, stops, currentLocation]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-ivory rounded-xl" style={{ height }}>
        <p className="text-charcoal">Failed to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-ivory rounded-xl" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-blue" />
      </div>
    );
  }

  const center = currentLocation || startLocation || defaultCenter;

  return (
    <div className="relative rounded-xl overflow-hidden border border-ivory-200" style={{ height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: center.lat, lng: center.lng }}
        zoom={13}
        options={mapOptions}
        onLoad={onMapLoad}
        onClick={handleMapClick}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}

        {/* Start marker */}
        {startLocation && !directions && (
          <Marker
            position={{ lat: startLocation.lat, lng: startLocation.lng }}
            icon={{
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#516A4E" stroke="white" stroke-width="4"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
          />
        )}

        {/* End marker */}
        {endLocation && !directions && (
          <Marker
            position={{ lat: endLocation.lat, lng: endLocation.lng }}
            icon={{
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#6C91C2" stroke="white" stroke-width="4"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
          />
        )}

        {/* Stop markers */}
        {stops.map((stop, index) => (
          !directions && (
            <Marker
              key={index}
              position={{ lat: stop.lat, lng: stop.lng }}
              label={{
                text: String(index + 1),
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
              icon={{
                url: 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#F59E0B" stroke="white" stroke-width="4"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              }}
            />
          )
        ))}

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

      {/* Current location button */}
      {showCurrentLocationButton && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-4 right-4 shadow-md bg-white hover:bg-ivory"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Instructions overlay */}
      {mode !== 'single' && !startLocation && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-sm text-charcoal">
          <MapPin className="h-4 w-4 inline mr-1 text-forest" />
          Click to set start point
        </div>
      )}
      {mode !== 'single' && startLocation && !endLocation && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-sm text-charcoal">
          <MapPin className="h-4 w-4 inline mr-1 text-slate-blue" />
          Click to set destination
        </div>
      )}
      {mode === 'route-with-stops' && startLocation && endLocation && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-sm text-charcoal">
          <MapPin className="h-4 w-4 inline mr-1 text-amber-500" />
          Click to add stops
        </div>
      )}
    </div>
  );
}
