package com.hospital.intelligence.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    // Find all meds for a specific patient
    List<Medication> findByPatientId(Long patientId);
}