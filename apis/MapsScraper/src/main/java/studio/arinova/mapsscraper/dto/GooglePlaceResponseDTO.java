package studio.arinova.mapsscraper.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GooglePlaceResponseDTO {

    private List<Result> results;
    private String status;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        private String name;
        @JsonAlias("vicinity")
        private String address;
        private Float rating;
        @JsonAlias("user_ratings_total")
        private Long userRatingsTotal;
        private Location location;
        @JsonAlias("place_id")
        private String placeId;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        private Double lat;
        private Double lng;
    }



}
