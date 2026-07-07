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

    // URLs DIRECTES des services (mêmes variables que le routage gateway) :
    // l'ancienne version appelait le gateway public en dur — le gateway se
    // sondait lui-même et jetait les résultats (health toujours « UP »).
    @org.springframework.beans.factory.annotation.Value("${MINE_XPERT_URL:}")
    private String mineXpertUrl;

    @org.springframework.beans.factory.annotation.Value("${SAFEX_URL:}")
    private String safexUrl;

    public Mono<Map<String, String>> checkHealth() {
        Mono<String> hrmsHealth = probe(mineXpertUrl + "/hrms/actuator/health");
        Mono<String> hnsHealth = probe(safexUrl + "/hns/actuator/health");

        return Mono.zip(hrmsHealth, hnsHealth)
                .map(tuple -> {
                    Map<String, String> result = new HashMap<>();
                    result.put("Gateway", "UP");
                    result.put("HRMS", tuple.getT1());
                    result.put("HNS", tuple.getT2());
                    return result;
                });
    }

    private Mono<String> probe(String url) {
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(Map.class)
                .map(map -> String.valueOf(map.getOrDefault("status", "DOWN")))
                .onErrorResume(e -> Mono.just("DOWN"));
    }
}
