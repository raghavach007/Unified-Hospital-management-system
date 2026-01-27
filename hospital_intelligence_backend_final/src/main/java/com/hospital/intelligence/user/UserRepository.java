package com.hospital.intelligence.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This allows finding a user by their username (for Login & Checks)
    Optional<User> findByUsername(String username);
    
    // This allows finding users by Role (for Admission Desk dropdowns)
    // Iterable is fine, or List<User>
    Iterable<User> findByRole(String role);
}