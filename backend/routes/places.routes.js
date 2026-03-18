import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';

const router = express.Router();

router.get('/autocomplete', adminAuthMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'query parameter required.' });

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Google Places API key not configured.' });

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json({ data: data.predictions || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:placeId/details', adminAuthMiddleware, async (req, res) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Google Places API key not configured.' });

    const fields = 'name,formatted_address,geometry,formatted_phone_number,website,rating,photos,opening_hours,place_id,address_components';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ message: `Google API error: ${data.status}` });
    }

    const result = data.result;
    const addressComponents = result.address_components || [];
    const getComponent = (type) => {
      const comp = addressComponents.find(c => c.types.includes(type));
      return comp ? comp.long_name : null;
    };

    return res.status(200).json({
      data: {
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        city: getComponent('locality') || getComponent('administrative_area_level_1'),
        country: getComponent('country'),
        latitude: result.geometry?.location?.lat,
        longitude: result.geometry?.location?.lng,
        phone_number: result.formatted_phone_number,
        website: result.website,
        rating: result.rating,
        photos: (result.photos || []).slice(0, 5).map(p => p.photo_reference),
        opening_hours: result.opening_hours?.weekday_text || null,
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

    const url = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${ref}&maxwidth=${maxwidth}&key=${apiKey}`;
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
