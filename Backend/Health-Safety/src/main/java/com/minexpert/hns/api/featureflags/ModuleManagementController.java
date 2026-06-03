package com.minexpert.hns.api.featureflags;

import com.minexpert.hns.dto.featureflags.ModuleManagementDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.featureflags.ModuleManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/modules")
@RequiredArgsConstructor
public class ModuleManagementController {
    private final ModuleManagementService service;

    @PostMapping("/create")
    public ResponseEntity<ModuleManagementDTO> create(@RequestBody ModuleManagementDTO dto) throws HSException {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ModuleManagementDTO> update(@RequestBody ModuleManagementDTO dto) throws HSException {
        return ResponseEntity.ok(service.update(dto));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<ModuleManagementDTO> updateStatus(@PathVariable Long id, @RequestParam Status status)
            throws HSException {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ModuleManagementDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/getByModule")
    public ResponseEntity<ModuleManagementDTO> getByModule(@RequestParam String module) throws HSException {
        return ResponseEntity.ok(service.getByModule(module));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ModuleManagementDTO>> getAll() throws HSException {
        return ResponseEntity.ok(service.getAll());
    }
}
