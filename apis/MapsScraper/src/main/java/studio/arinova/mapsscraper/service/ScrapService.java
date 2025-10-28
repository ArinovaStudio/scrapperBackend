package studio.arinova.mapsscraper.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import studio.arinova.mapsscraper.dto.GeolocationResponseDTO;
import studio.arinova.mapsscraper.dto.GooglePlaceResponseDTO;
import studio.arinova.mapsscraper.dto.RequestDTO;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


/**
 * Service class responsible for scraping nearby location data
 * from Google Maps APIs ( Geocoding and Nearby Search).
 */

@Service
@RequiredArgsConstructor
public class ScrapService {

    // Google Maps API Key injected from application.yml file.
    @Value("${google.maps.api}")
    private String GOOGLE_MAPS_API;
    private final String GOOGLE_GEO_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    private final String GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * scrapNearbyLocations Fetches and scrapes nearby location data based on the given request parameters.
     * @param requestDTO
     * @return
     * @throws Exception
     */
    public ResponseEntity<?> scrapNearbyLocations(@NonNull RequestDTO requestDTO) throws Exception {
        // Checking the DTO fields are valid or not.
        if (!isAllFieldsValid(requestDTO)) {
            return ResponseEntity.badRequest().body("Fields are not valid");
        }

        // Step 1: Converting the location to latitude and longitude via Geocoding API.
        String encodedLocation = URLEncoder.encode(requestDTO.getLocation().trim(), StandardCharsets.UTF_8);
        String geoURL = UriComponentsBuilder.fromUri(URI.create(GOOGLE_GEO_URL))
                .queryParam("address", encodedLocation)
                .queryParam("region", "in")
                .queryParam("key", GOOGLE_MAPS_API)
                .toUriString();

        // Creating Header Object.
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> geoResponseEntity = restTemplate.exchange(geoURL, HttpMethod.GET, entity, String.class);

        if (!geoResponseEntity.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity.status(geoResponseEntity.getStatusCode())
                    .body("Failed to fetch the GeoLocation");
        }

        // Mapping the Object
        GeolocationResponseDTO geolocationResponseDTO = objectMapper.readValue(geoResponseEntity.getBody(), GeolocationResponseDTO.class);

        if (geolocationResponseDTO.getLat() == null || geolocationResponseDTO.getLng() == null) {
            return ResponseEntity.internalServerError().body("Failed to extract lat/lng from geocoding response");
        }

        // Step 2: Make call to the Google Nearby Search API.
        String placeURL = UriComponentsBuilder.fromUri(URI.create(GOOGLE_PLACES_URL))
                .queryParam("location", String.format("%s,%s", geolocationResponseDTO.getLat(), geolocationResponseDTO.getLng()))
                .queryParam("radius", 5000) // Nearby 5 km radius.
                .queryParam("type", requestDTO.getType())
                .queryParam("key", GOOGLE_MAPS_API)
                .toUriString();

        ResponseEntity<String> placeLocationResponseEntity = restTemplate
                .exchange(placeURL, HttpMethod.GET, entity, String.class);

        // Then we have to check the response is ok or not.
        if (!placeLocationResponseEntity.getStatusCode().is2xxSuccessful()) {
            return ResponseEntity
                    .status(placeLocationResponseEntity.getStatusCode())
                    .body("Failed to fetch the place locations");
        }

        // Mapping to object.
        GooglePlaceResponseDTO googlePlaceResponseDTO = objectMapper.readValue(placeLocationResponseEntity.getBody(), GooglePlaceResponseDTO.class);

        return ResponseEntity.ok(googlePlaceResponseDTO);
    }

    /**
     * isAllFieldsValid Checks for the empty fields if not empty returns true else false.
     * @param requestDTO
     * @return boolean
     */
    private boolean isAllFieldsValid(RequestDTO requestDTO) {
        return !requestDTO.getType().trim().isEmpty() && !requestDTO.getLocation().trim().isEmpty();
    }

}
