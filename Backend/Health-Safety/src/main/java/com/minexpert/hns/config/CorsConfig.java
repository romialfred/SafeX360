package com.minexpert.hns.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("https://health-safety-eight.vercel.app", "https://safex360.data-univers.com",
                                "http://localhost:3000",
                                "http://localhost:5173", "http://localhost:5174", "http://app2.localtest.me:5173",
                                "http://app1.localtest.me:3000", "https://mine-xpert.data-univers.com",
                                "https://dev.safex360.data-univers.com")
                        .allowedMethods("GET", "POST", "PUT", "DELETE")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

}
