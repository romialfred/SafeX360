package com.hms.gateway.clients;

import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "hrms", configuration = FeignClientInterceptor.class)
public interface HrmsClient {
    @GetMapping("/hrms/actuator/health")
    Map<String, Object> health();
}
