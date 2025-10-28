package studio.arinova.mapsscraper.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import studio.arinova.mapsscraper.dto.RequestDTO;
import studio.arinova.mapsscraper.service.ScrapService;

/**
 * MainController: It handles the incoming requests.
 */

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MainController {

    private final ScrapService scrapService;

    @PostMapping("/scrap")
    public ResponseEntity<?> scrapLocationHandler(@RequestBody RequestDTO requestDTO) throws Exception {
        return scrapService.scrapNearbyLocations(requestDTO);
    }

    /**
     * healthHandler - Health request handler
     * @return
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthHandler() {
        return ResponseEntity.ok("Health is OK");
    }

}
