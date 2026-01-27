package com.hospital.intelligence.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Disable CSRF (Common for REST APIs)
            .csrf(AbstractHttpConfigurer::disable)
            
            // 2. Enable CORS with our custom configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 3. Define URL permissions
            .authorizeHttpRequests(auth -> auth
                // Allow public access to these endpoints:
                .requestMatchers("/api/auth/**").permitAll()   // Login
                .requestMatchers("/ws/**").permitAll()         // WebSockets
                .requestMatchers("/api/users").permitAll()     // Staff List (Fix for your error)
                .requestMatchers("/api/**").permitAll()        // Allow ALL API for development
                
                // Any other request needs authentication
                .anyRequest().permitAll() 
            );
            
        return http.build();
    }

    /**
     * CORS CONFIGURATION
     * This tells the browser: "Accept requests from ANYWHERE"
     */
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // ALLOW ALL ORIGINS (Frontend URLs)
        config.setAllowedOriginPatterns(List.of("*")); 
        // Or specific: config.setAllowedOrigins(List.of("http://127.0.0.1:5500", "http://localhost:5500"));

        // ALLOW ALL METHODS (GET, POST, PUT, DELETE)
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // ALLOW ALL HEADERS
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        
        // ALLOW CREDENTIALS (Cookies/Auth Tokens)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}