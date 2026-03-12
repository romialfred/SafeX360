package com.hms.gateway.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class HealthAggregator {
    private final WebClient webClient;

    public Mono<Map<String, String>> checkHealth() {
        Mono<String> hrmsHealth = webClient.get()
                .uri("https://gateway.data-univers.com/hrms/actuator/health")
                .retrieve()
                .bodyToMono(Map.class)
                .map(map -> String.valueOf(map.getOrDefault("status", "DOWN")))
                .onErrorResume(e -> Mono.just("DOWN"));

        Mono<String> hnsHealth = webClient.get()
                .uri("https://gateway.data-univers.com/hns/actuator/health")
                .retrieve()
                .bodyToMono(Map.class)
                .map(map -> String.valueOf(map.getOrDefault("status", "DOWN")))
                .onErrorResume(e -> Mono.just("DOWN"));

        return Mono.zip(hrmsHealth, hnsHealth)
                .map(tuple -> {
                    Map<String, String> result = new HashMap<>();
                    result.put("Gateway", "UP");
                    // result.put("HRMS", tuple.getT1());
                    // result.put("HNS", tuple.getT2());
                    return result;
                });
    }
}
