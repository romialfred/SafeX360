package com.minexpert.hns;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"com.minexpert.hns", "com.example.mail"})

@EnableFeignClients
@EnableDiscoveryClient
@EnableScheduling
public class HealthSafetyApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealthSafetyApplication.class, args);
	}

}
