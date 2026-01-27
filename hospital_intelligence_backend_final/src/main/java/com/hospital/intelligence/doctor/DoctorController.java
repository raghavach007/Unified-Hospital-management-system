
package com.hospital.intelligence.doctor;

import com.hospital.intelligence.patient.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctor")
@CrossOrigin
public class DoctorController {

    private final PatientRepository repo;

    public DoctorController(PatientRepository r) {
        this.repo = r;
    }

    @GetMapping("/patients/{name}")
    public List<Patient> myPatients(@PathVariable String name) {
        return repo.findByDoctor(name);
    }
}
