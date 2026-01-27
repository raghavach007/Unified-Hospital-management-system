package com.hospital.intelligence.auth;

import com.hospital.intelligence.user.User;
import com.hospital.intelligence.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> creds) {
        String username = creds.get("username");
        String password = creds.get("password");

        Map<String, String> response = new HashMap<>();

        // 1. Find User (Safely handle if not found)
        User user = userRepository.findByUsername(username).orElse(null);

        // 2. Validate Password
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            // Generate a simple token (In production, use JWT)
            String token = "mock-jwt-token-" + user.getId();
            
            response.put("token", token);
            response.put("role", user.getRole());
            response.put("username", user.getUsername());
            return response; // Return JSON with token
        }

        // Login Failed
        return null; // Triggers 401 or empty response on frontend
    }
}