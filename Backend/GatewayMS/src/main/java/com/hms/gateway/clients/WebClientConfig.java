package com.hms.gateway.clients;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @org.springframework.beans.factory.annotation.Value("${INTERNAL_GATEWAY_SECRET:}")
    private String internalGatewaySecret;

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
                .defaultHeader("X-Secret-Key", internalGatewaySecret)
                .build();
    }
}