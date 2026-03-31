import { useState, useRef, useEffect, useCallback } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Google Places Autocomplete component for address input.
 * Loads the Google Places API script dynamically and provides address suggestions.
 *
 * @param {string} value - Current input value
 * @param {function} onChange - Called with the raw text value on every keystroke
 * @param {function} onPlaceSelect - Called with { city, country, lat, lng, formattedAddress } when a place is selected
 * @param {string} placeholder - Input placeholder text
 * @param {string} label - Field label
 */
const PlacesAutocomplete = ({ value, onChange, onPlaceSelect, placeholder = 'Search for your city...', label = 'Location' }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script if not already loaded
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('PlacesAutocomplete: VITE_GOOGLE_MAPS_API_KEY not set, falling back to manual input');
      return;
    }

    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[data-google-places]')) {
      const waitForLoad = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          clearInterval(waitForLoad);
        }
      }, 100);
      return () => clearInterval(waitForLoad);
    }

    const script = document.createElement('script');
    script.setAttribute('data-google-places', 'true');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('PlacesAutocomplete: Failed to load Google Maps script');
    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete once script is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['address_components', 'geometry', 'formatted_address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place?.address_components) return;

      let city = '';
      let country = '';

      for (const component of place.address_components) {
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
          city = city || component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      const lat = place.geometry?.location?.lat() ?? null;
      const lng = place.geometry?.location?.lng() ?? null;

      onChange(place.formatted_address || `${city}, ${country}`);
      onPlaceSelect?.({
        city,
        country,
        lat,
        lng,
        formattedAddress: place.formatted_address || '',
      });
    });
  }, [isLoaded, onChange, onPlaceSelect]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isLoaded ? placeholder : 'Enter city manually...'}
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      {!GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-gray-400 mt-1">Google Places not configured. Enter city manually.</p>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
