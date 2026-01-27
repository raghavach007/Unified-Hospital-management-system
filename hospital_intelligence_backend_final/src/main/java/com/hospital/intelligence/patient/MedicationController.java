package com.hospital.intelligence.patient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    @Autowired
    private MedicationRepository medicationRepository;

    // 1. Doctor adds prescription
    @PostMapping("/add")
    public Medication addMedication(@RequestBody Medication med) {
        med.setStatus("PENDING");
        med.setTimestamp(LocalDateTime.now());
        return medicationRepository.save(med);
    }

    // 2. Get list (for Doctor/Nurse)
    @GetMapping("/patient/{patientId}")
    public List<Medication> getByPatient(@PathVariable Long patientId) {
        return medicationRepository.findByPatientId(patientId);
    }

    // 3. Nurse administers med
    @PutMapping("/{id}/give")
    public Medication markGiven(@PathVariable Long id) {
        return medicationRepository.findById(id).map(med -> {
            med.setStatus("GIVEN");
            med.setTimestamp(LocalDateTime.now());
            return medicationRepository.save(med);
        }).orElse(null);
    }
}