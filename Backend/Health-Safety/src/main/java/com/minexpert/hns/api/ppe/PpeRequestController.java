package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/ppe-request")
@RequiredArgsConstructor
public class PpeRequestController {
    private final PpeRequestService requestService;

    @PostMapping("/create")
    public ResponseEntity<PpeRequestDTO> create(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeRequestDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(requestService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeRequestDTO> update(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeRequestDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(requestService.update(dto, companyId));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<PpeRequestDTO> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(requestService.approveRequest(id, comment, companyId));
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<PpeRequestDTO> reject(
            @PathVariable Long id,
            @RequestParam String comment,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(requestService.rejectRequest(id, comment, companyId));
    }

    // Livraison effective d'une demande EPI APPROVED (passage -> DELIVERED, horodaté).
    @PutMapping("/deliver/{id}")
    public ResponseEntity<PpeRequestDTO> deliver(
            @PathVariable Long id,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(requestService.deliverRequest(id, comment, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeRequestDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(requestService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeRequestDTO>> getAll(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(requestService.getAllRequests(companyId));
    }

}
