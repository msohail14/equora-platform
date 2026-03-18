import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';

const router = express.Router();
const API_BASE = 'https://places.googleapis.com/v1';

router.get('/health', (_req, res) => {
  const keySet = !!process.env.GOOGLE_PLACES_API_KEY;
  return res.status(200).json({
    configured: keySet,
    key_prefix: keySet ? process.env.GOOGLE_PLACES_API_KEY.substring(0, 8) + '...' : null,
  });
});

router.get('/autocomplete', adminAuthMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'query parameter required.' });

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Google Places API key not configured.' });

    const response = await fetch(`${API_BASE}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({ input: query }),
    });
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: `Google API error: ${data.error.message || data.error.status}` });
    }

    const predictions = (data.suggestions || [])
      .filter((s) => s.placePrediction)
      .map((s) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.text?.text || '',
        structured_formatting: {
          main_text: s.placePrediction.structuredFormat?.mainText?.text || '',
          secondary_text: s.placePrediction.structuredFormat?.secondaryText?.text || '',
        },
      }));

    return res.status(200).json({ data: predictions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:placeId/details', adminAuthMiddleware, async (req, res) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Google Places API key not configured.' });

    const fieldMask = [
      'id', 'displayName', 'formattedAddress', 'location',
      'internationalPhoneNumber', 'websiteUri', 'rating',
      'photos', 'regularOpeningHours', 'addressComponents',
    ].join(',');

    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    });
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: `Google API error: ${data.error.message || data.error.status}` });
    }

    const components = data.addressComponents || [];
    const getComponent = (type) => {
      const comp = components.find((c) => c.types?.includes(type));
      return comp ? (comp.longText || comp.shortText) : null;
    };

    return res.status(200).json({
      data: {
        place_id: data.id || placeId,
        name: data.displayName?.text || '',
        formatted_address: data.formattedAddress || '',
        city: getComponent('locality') || getComponent('administrative_area_level_2') || getComponent('administrative_area_level_1'),
        state: getComponent('administrative_area_level_1'),
        country: getComponent('country'),
        pincode: getComponent('postal_code'),
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        phone_number: data.internationalPhoneNumber || null,
        website: data.websiteUri || null,
        rating: data.rating || null,
        photos: (data.photos || []).slice(0, 5).map((p) => p.name),
        opening_hours: data.regularOpeningHours?.weekdayDescriptions || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/photo', async (req, res) => {
  try {
    const { ref, maxwidth = 400 } = req.query;
    if (!ref) return res.status(400).json({ message: 'ref parameter required.' });

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Google Places API key not configured.' });

    const url = `${API_BASE}/${ref}/media?maxWidthPx=${maxwidth}&key=${apiKey}`;
    const response = await fetch(url, { redirect: 'follow' });

    const contentType = response.headers.get('content-type');
    const buffer = Buffer.from(await response.arrayBuffer());

    res.set('Content-Type', contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
