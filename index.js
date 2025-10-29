import express, { response } from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Google Maps API base URL
const GOOGLE_PLACES_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

// Perplexity API base URL
const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";

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

/**
 * POST /research
 * Body: {
 *   "name": "Peter Luger Steak House",
 *   "location": "255 Northern Boulevard, Great Neck",
 *   "rating": 4.5,
 *   "userRatingsTotal": 3725,
 *   "location": null,
 *   "placeId": "ChIJKXFLL-uJwokREGE5L-3oRxc"
 * }
 */
app.post("/research", async (req, res) => {
  try {
    const reqData = req.body;

    // Checking the body length.
    if (!reqData.results.length) {
      return res.status(401).json({ error: "No Data found to do research" });
    }

    // Converting it to JSON.
    const placesJSON = JSON.stringify(reqData.results, null, 2);

    // Making request to perplexity.
    const researchResp = await axios.post(PERPLEXITY_API,
      {
        model: "sonar",
        messages: [
          {
            role: "user",
            content: `
              Analyze the following list of places. For each, give:
              - A short summary (1-2 Lines)
              - Key highlights or special features
              - Whether it's popular among locals or tourists

              Return the result **as JSON** in this format:
              [
                {
                  "name": "...",
                  "summary": "...",
                  "highlights": ["..."],
                  "popularity": "..."
                }
              ]

              Here's the Data:
              ${placesJSON}
            `
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
        }
      });

    const result = researchResp.data.choices[0].message.content;
    return res.status(200).json({ response: extractJSON(result) });

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to do research" });
  }
})

/**
 * extractJSON: Extracts the Invalid JSON.
 * @param {*} text
 * @returns
 */
const extractJSON = (text) => {
  try {
    // Matching the JSON.
    const jsonMatch = text.match(/```json([\s\S]*?)```/);
    const cleanText = jsonMatch ? jsonMatch[1] : text;

    // Cleaning up the JSON if any invalid character founds.
    const validJSON = cleanText
      .trim()
      .replace(/,\s*([\]}])/g, "$1");

    return JSON.parse(validJSON)
  } catch (err) {
    console.error("Failed to parse JSON:", err.message);
    return { error: "Invalid JSON returned from model", raw: text };
  }
}

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
