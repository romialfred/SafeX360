package com.hrms.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hrms.dto.EmergencyContactDTO;
import com.hrms.dto.EmployeeEvacuationDTO;
import com.hrms.service.EmployeeEvacuationService;

import lombok.RequiredArgsConstructor;

/**
 * Parametres d'evacuation du personnel (SIRH). Base : {@code /hrms/evacuation}.
 *
 * <p>Priorite d'evacuation, point de rassemblement affecte et contacts d'urgence
 * par employe. Consomme par la fiche employe (edition) et par la salle de crise
 * (lecture de la priorite effective).</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/evacuation")
@RequiredArgsConstructor
public class EmployeeEvacuationController {

    private final EmployeeEvacuationService service;

    /** Vue SIRH par mine (priorite effective par employe) - pour la salle de crise. */
    @GetMapping
    public ResponseEntity<List<EmployeeEvacuationDTO>> list(@RequestParam Long companyId) {
        return ResponseEntity.ok(service.listByCompany(companyId));
    }

    /** Fiche evacuation d'un employe (priorite, point, contacts). */
    @GetMapping("/{employeeId}")
    public ResponseEntity<EmployeeEvacuationDTO> get(@PathVariable Long employeeId) {
        return ResponseEntity.ok(service.getProfile(employeeId));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<EmployeeEvacuationDTO> upsert(
        @PathVariable Long employeeId,
        @RequestBody EmployeeEvacuationDTO dto,
        @RequestParam(required = false) Long actorId
    ) {
        return ResponseEntity.ok(service.upsert(employeeId, dto, actorId));
    }

    @PostMapping("/{employeeId}/contacts")
    public ResponseEntity<EmergencyContactDTO> addContact(
        @PathVariable Long employeeId,
        @RequestBody EmergencyContactDTO dto
    ) {
        return ResponseEntity.ok(service.addContact(employeeId, dto));
    }

    @PutMapping("/contacts/{id}")
    public ResponseEntity<EmergencyContactDTO> updateContact(
        @PathVariable Long id,
        @RequestBody EmergencyContactDTO dto
    ) {
        return ResponseEntity.ok(service.updateContact(id, dto));
    }

    @DeleteMapping("/contacts/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        return service.deleteContact(id)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}
