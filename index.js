import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { scrapContacts } from "./scrapingContact.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: '*'
}));

// Google Maps API base URL
//const GOOGLE_PLACES_API = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

/**
 * POST /scrap
 * Body: {
 *   "type": "restaurant",
 *   "location": "New York, USA",
 *   "limit": 10
 * }
 */



async function performScraping(type, location, limit) {
  
  // Example: Using Google Places API
  const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
    params: {
      query: `${type} in ${location}`,
      key: process.env.GOOGLE_PLACES_API,
      type: type
    }
  });
  console.log(process.env.GOOGLE_PLACES_API)

  const detailedResults = await Promise.all(
      response.data.results.map(async (place) => {
        try {
          const details = place;
          // console.log(details)
          return {
            name: details.name || place.name || 'N/A',
            rating: details.rating || place.rating || 'No rating',
            address: details.formatted_address || place.formatted_address || place.vicinity || 'Address not available',
            ...await scrapContacts(place.place_id), // Email needs to be scraped from website
            link: details.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            userRatingsTotal: details.user_ratings_total || place.user_ratings_total || 0,
            openNow: details.opening_hours?.open_now ?? place.opening_hours?.open_now ?? null,
          };
        } catch (error) {
          console.error(`Error fetching details for ${place.name}:`, error.message);
          // Return basic info if details fetch fails
          return {
            name: place.name || 'N/A',
            rating: place.rating || 'No rating',
            address: place.formatted_address || place.vicinity || 'Address not available',
            phone: 'Not available',
            url: 'Not available',
            startingPrice: 'Not available',
            link: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            userRatingsTotal: place.user_ratings_total || 0,
            openNow: place.opening_hours?.open_now ?? null,
          };
        }
      })
    );

  // console.log(JSON.stringify(response.data.results, null, 2));
  
  return detailedResults.slice(0, limit);

}


app.post("/scrap", async (req, res) => {
  try {
    const { type, location, limit = 10 } = req.body;
    console.log("Received request:", req.body);

    if (!type || !location) {
      return res.status(400).json({ error: "Missing required fields: type, location" });
    }

    const results = await performScraping(type, location, limit);
    // console.log(results)

    res.json({ count: results.length, results });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch nearby places" });
  }
});

app.post("/research", async (req, res) => {
  const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";
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
              "Authorization": `Bearer ${process.env.PERPLEXITY_API}`
            }
          });
          
          const result = researchResp.data.choices[0].message.content;
          console.log(result)
          return res.status(200).json({ response: extractJSON(result) || result });
          
        } catch (error) {
          console.error("Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to do research" });
  }
})

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
