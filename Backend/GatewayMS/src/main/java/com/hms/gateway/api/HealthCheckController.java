package com.hms.gateway.api;

import com.hms.gateway.service.HealthAggregator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin
public class HealthCheckController {

    private final HealthAggregator healthAggregator;

    @GetMapping("/services-health")
    public Mono<ResponseEntity<Map<String, String>>> healthCheck() {
        Mono<ResponseEntity<Map<String, String>>> ans = healthAggregator.checkHealth()
                .map(health -> {
                    boolean allUp = health.values().stream().allMatch(status -> status.equals("UP"));
                    return ResponseEntity.status(allUp ? 200 : 503).body(health);
                });
        return ans;

    }
}