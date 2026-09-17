package com.example.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()   // <-- allow all auth APIs
                        .requestMatchers("/api/restaurant/login", "/api/restaurant/register").permitAll() // <-- allow restaurant auth
                        .requestMatchers("/api/restaurants/**").permitAll()   // <-- allow restaurant browsing
                        .requestMatchers("/api/menus/**").permitAll()   // <-- allow menu browsing
                        .requestMatchers("/api/test").permitAll()   // <-- test endpoint
                        .requestMatchers("/api/init-data").permitAll()   // <-- data initialization
                        .requestMatchers("/api/update-images").permitAll()   // <-- update restaurant images
                        .requestMatchers("/api/add-menu-items").permitAll()   // <-- add menu items
                        .requestMatchers("/api/remove-beef-items").permitAll()   // <-- remove beef items
                        .requestMatchers("/api/promo/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/partner/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            if ("*".equals(allowedOrigins.trim())) {
                config.addAllowedOriginPattern("*");
            } else {
                List<String> origins = Arrays.asList(allowedOrigins.split(","));
                for (String origin : origins) {
                    String cleanOrigin = origin.trim();
                    if (!cleanOrigin.isEmpty()) {
                        config.addAllowedOrigin(cleanOrigin);
                    }
                }
            }
        } else {
            config.addAllowedOriginPattern("*");
        }

        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

