import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Google Maps API base URL
const GOOGLE_PLACES_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

/**
 * POST /scrap
 * Body: {
 *   "type": "restaurant",
 *   "location": "New York, USA",
 *   "limit": 10
 * }
 */
app.post("/scrap", async (req, res) => {
  try {
    const { type, location, limit = 10 } = req.body;

    if (!type || !location) {
      return res.status(400).json({ error: "Missing required fields: type, location" });
    }

    // Step 1: Convert city name to lat/lng using Geocoding API
    const geoResp = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: encodeURIComponent(location),
        region: "in",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const geoData = geoResp.data;
    if (!geoData.results.length) {
      return res.status(404).json({
        error: "Location not found", details: geoData
      });
    }

    const { lat, lng } = geoData.results[0].geometry.location;

    // Step 2: Call Nearby Search API
    const nearbyResp = await axios.get(GOOGLE_PLACES_API, {
      params: {
        location: `${lat},${lng}`,
        radius: 5000, // you can adjust the radius (in meters)
        type,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    let results = nearbyResp.data.results.slice(0, limit);

    // Step 3: Return simplified results
    const places = results.map((place) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      location: place.geometry.location,
      place_id: place.place_id,
    }));

    res.json({ count: places.length, places });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch nearby places" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
