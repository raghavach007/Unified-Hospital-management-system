package com.hospital.intelligence.patient;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    // 1. Get Patients for Nurse Dashboard
    @GetMapping("/nurse/{username}")
    public List<Patient> getPatientsByNurse(@PathVariable String username) {
        return patientRepository.findByNurse(username);
    }
    
    // 2. Get Patients for Doctor Dashboard
    @GetMapping("/doctor/{username}")
    public List<Patient> getPatientsByDoctor(@PathVariable String username) {
        return patientRepository.findByDoctor(username);
    }
    
    // 3. Register New Patient
    @PostMapping("/register")
    public Patient registerPatient(@RequestBody Patient patient) {
        
        // --- FIX IS HERE ---
        // We use .getCondition() and .setCondition() now
        if (patient.getCondition() == null) {
            patient.setCondition("Stable");
        }
        
        return patientRepository.save(patient);
    }
    // ... existing code ...

    // 4. Update Patient Condition (e.g., Stable -> Critical)
    @PutMapping("/{id}/condition")
    public Patient updateCondition(@PathVariable Long id, @RequestBody String newCondition) {
        return patientRepository.findById(id).map(patient -> {
            patient.setCondition(newCondition); // Uses your Setter
            return patientRepository.save(patient);
        }).orElse(null);
    }

    // 5. Discharge Patient (Delete from DB)
    @DeleteMapping("/{id}")
    public String dischargePatient(@PathVariable Long id) {
        patientRepository.deleteById(id);
        return "Patient discharged successfully.";
    }
}