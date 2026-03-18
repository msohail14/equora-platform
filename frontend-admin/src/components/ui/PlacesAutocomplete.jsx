import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { searchPlacesApi, getPlaceDetailsApi } from '../../features/operations/operationsApi';

const PlacesAutocomplete = ({ onSelect, placeholder = 'Search for a place on Google Maps...' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchPlacesApi(value);
        const predictions = res?.data || [];
        setSuggestions(predictions);
        setOpen(predictions.length > 0);
      } catch (err) {
        console.error('Places autocomplete error:', err);
        toast.error(err?.message || 'Places search failed. Check API key configuration.');
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = async (prediction) => {
    setSelecting(true);
    setQuery(prediction.description);
    setOpen(false);
    setSuggestions([]);

    try {
      const res = await getPlaceDetailsApi(prediction.place_id);
      const place = res?.data || {};
      onSelect?.({
        name: place.name || '',
        city: place.city || '',
        state: place.state || '',
        country: place.country || '',
        pincode: place.pincode || '',
        latitude: place.latitude ?? '',
        longitude: place.longitude ?? '',
        contact_phone: place.phone_number || '',
        formatted_address: place.formatted_address || '',
        google_place_id: place.place_id || prediction.place_id,
        google_rating: place.rating ?? '',
        website: place.website || '',
      });
    } catch (err) {
      console.error('Place details error:', err);
      toast.error(err?.message || 'Failed to fetch place details.');
      onSelect?.({ name: prediction.structured_formatting?.main_text || '' });
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Search Google Maps
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-emerald-400"
        />
        <svg
          className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {(loading || selecting) && (
          <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {s.structured_formatting?.main_text || s.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {s.structured_formatting?.secondary_text || ''}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
