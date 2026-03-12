package com.hms.gateway.clients;

import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "Health-Safety", configuration = FeignClientInterceptor.class)
public interface HsClient {
    @GetMapping("/hns/actuator/health")
    Map<String, Object> health();
}