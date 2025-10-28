package studio.arinova.mapsscraper.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeolocationResponseDTO {
    private List<Result> results;
    private String status;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        private Geometry geometry;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Geometry {
        private Location location;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Location {
        private Double lat;
        private Double lng;
    }

    // Helper methods.
    public Double getLat() {
        if (results != null && !results.isEmpty()) {
            return results.get(0).getGeometry().getLocation().getLat();
        }
        return null;
    }

    public Double getLng() {
        if (results != null && !results.isEmpty()) {
            return results.get(0).getGeometry().getLocation().getLng();
        }
        return null;
    }
}
