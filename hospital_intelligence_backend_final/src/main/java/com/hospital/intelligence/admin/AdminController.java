package com.hospital.intelligence.admin;

import com.hospital.intelligence.user.User;
import com.hospital.intelligence.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPatients", 120); // Placeholder or fetch from PatientRepo
        stats.put("occupancy", 85);
        stats.put("doctorsActive", userRepository.findByRole("DOCTOR").spliterator().getExactSizeIfKnown());
        stats.put("critical", 3);
        return stats;
    }

    @PostMapping("/create-user")
    public boolean createUser(@RequestBody User user) {
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return false; // User exists
        }

        // Encrypt password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Ensure active is set
        user.setActive(true);
        
        userRepository.save(user);
        return true;
    }
}