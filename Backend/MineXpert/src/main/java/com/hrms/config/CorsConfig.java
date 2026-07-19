package com.hrms.config;

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
                                // Domaine Vercel de PROD. Manquait depuis toujours : le defaut
                                // etait LATENT tant que l'Origin ne parvenait pas jusqu'ici, et
                                // la nouvelle chaine gateway (qui transmet l'Origin de bout en
                                // bout) l'a revele — « Invalid CORS request » sur tout POST
                                // depuis safex360.vercel.app.
                                "https://safex360.vercel.app",
                                "http://localhost:3000",
                                "http://localhost:5173", "http://localhost:5174",
                                "http://localhost:5474", "http://localhost:5475",
                                // APK Capacitor (WebView Android/iOS) — appels directs au gateway
                                "https://localhost", "capacitor://localhost",
                                "http://app1.localtest.me:3000",
                                "http://app2.localtest.me:5173", "https://mine-xpert.data-univers.com",
                                "https://dev.safex360.data-univers.com")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

}
