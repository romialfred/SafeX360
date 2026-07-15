package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.risks.OpportunityDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.OpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/risks/opportunities")
@RequiredArgsConstructor
public class OpportunityController {
    private final OpportunityService opportunityService;

    @PostMapping("/create")
    public ResponseEntity<OpportunityDTO> create(@Valid @RequestBody OpportunityDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(opportunityService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<OpportunityDTO>> list(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(opportunityService.list(companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<OpportunityDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(opportunityService.getById(id, companyId));
    }

    @PutMapping("/update")
    public ResponseEntity<OpportunityDTO> update(@Valid @RequestBody OpportunityDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(opportunityService.update(dto, companyId));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<OpportunityDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(opportunityService.updateStatus(id, status, companyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        opportunityService.delete(id, companyId);
        return ResponseEntity.ok(new ResponseDTO("OPPORTUNITY_DELETED"));
    }
}
