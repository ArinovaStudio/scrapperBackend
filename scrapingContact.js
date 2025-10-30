import axios from "axios";


export const scrapContacts = async (placeId) => {
  if (!placeId || placeId === "Not available") return "Not available";

  try {
    const detailsResponse = await axios.get(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API,
          'X-Goog-FieldMask': '*'
        }
      }
    );
    // console.log(`Details Response Data:`, JSON.stringify(detailsResponse.data, null, 2));

    return {
      phone: detailsResponse.data.internationalPhoneNumber || "Not available",
      url: detailsResponse.data.websiteUri || "Not available",
      startingPrice: detailsResponse.data.priceRange.startPrice.units || "Not available",
    };
  } catch (error) {
    console.error("Error scraping contacts:", error.message);
    return {phone: "Not available", url: "Not available", startingPrice: "Not available"};
  }
};
