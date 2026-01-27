package com.hospital.intelligence.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    
    // Finds patients assigned to a specific nurse
    List<Patient> findByNurse(String nurse);
    
    // Finds patients assigned to a specific doctor
    List<Patient> findByDoctor(String doctor);
}