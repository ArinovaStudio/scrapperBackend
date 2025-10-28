package studio.arinova.mapsscraper.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;

@Builder
@Data
@AllArgsConstructor
@NonNull
public class ResponseDTO {
    private String name;
    private String address;
    private Float rating;
    private int userRatingsTotal;
    private GooglePlaceResponseDTO.Location location;
    private String placeId;
}
