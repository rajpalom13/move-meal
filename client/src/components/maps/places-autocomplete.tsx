'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGoogleMaps } from './google-maps-provider';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, X, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface PlacesAutocompleteProps {
  value?: string;
  onSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  disabled?: boolean;
  showCurrentLocation?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function PlacesAutocomplete({
  value = '',
  onSelect,
  placeholder = 'Search location...',
  className,
  icon,
  iconColor = 'text-charcoal-light',
  disabled = false,
  showCurrentLocation = false,
}: PlacesAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize services
  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService
      const div = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, [isLoaded]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch predictions
  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || !input.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'in' }, // Restrict to India
        types: ['geocode', 'establishment'],
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results as Prediction[]);
          setIsOpen(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  // Handle prediction selection
  const handleSelect = (prediction: Prediction) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address'],
      },
      (place, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || prediction.description,
          };
          setInputValue(location.address);
          onSelect(location);
          setIsOpen(false);
          setPredictions([]);
        }
      }
    );
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        try {
          const response = await geocoder.geocode({ location: { lat, lng } });
          const address = response.results[0]?.formatted_address || 'Current Location';
          setInputValue(address);
          onSelect({ lat, lng, address });
        } catch {
          onSelect({ lat, lng, address: 'Current Location' });
        }
        setIsGettingLocation(false);
        setIsOpen(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
      }
    );
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setPredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded) {
    return (
      <div className={cn('relative', className)}>
        <div className={cn('absolute left-3 top-1/2 -translate-y-1/2', iconColor)}>
          {icon || <MapPin className="h-4 w-4" />}
        </div>
        <Input
          disabled
          placeholder="Loading..."
          className="h-11 pl-10 pr-10"
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className={cn('absolute left-3 top-1/2 -translate-y-1/2 z-10', iconColor)}>
        {icon || <MapPin className="h-4 w-4" />}
      </div>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => predictions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 pl-10 pr-10"
      />

      {/* Loading/Clear button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-charcoal-light" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-charcoal-light hover:text-charcoal transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {isOpen && (predictions.length > 0 || showCurrentLocation) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-ivory-200 shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Current location option */}
          {showCurrentLocation && (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-forest-50 transition-colors text-left border-b border-ivory-100"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-forest" />
              ) : (
                <Navigation className="h-4 w-4 text-forest" />
              )}
              <span className="text-sm text-forest-700 font-medium">Use current location</span>
            </button>
          )}

          {/* Predictions */}
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-ivory transition-colors text-left"
            >
              <MapPin className="h-4 w-4 text-charcoal-light mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-charcoal-dark font-medium truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-charcoal truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
