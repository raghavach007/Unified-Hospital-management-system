
package com.hospital.intelligence.admission;

import com.hospital.intelligence.patient.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admission")
@CrossOrigin
public class AdmissionController {

    private final PatientRepository repo;

    public AdmissionController(PatientRepository r) {
        this.repo = r;
    }

    @PostMapping("/register")
    public Patient register(@RequestBody Patient p) {
        return repo.save(p);
    }
}
