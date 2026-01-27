
package com.hospital.intelligence.nurse;

import com.hospital.intelligence.patient.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/nurse")
@CrossOrigin
public class NurseController {

    private final PatientRepository repo;

    public NurseController(PatientRepository r) {
        this.repo = r;
    }

    @GetMapping("/patients/{name}")
    public List<Patient> myPatients(@PathVariable String name) {
        return repo.findByNurse(name);
    }
}
