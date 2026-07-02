package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.risks.OpportunityDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.OpportunityService;
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
    public ResponseEntity<OpportunityDTO> create(@RequestBody OpportunityDTO dto) throws HSException {
        return ResponseEntity.ok(opportunityService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<OpportunityDTO>> list() throws HSException {
        return ResponseEntity.ok(opportunityService.list());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<OpportunityDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(opportunityService.getById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<OpportunityDTO> update(@RequestBody OpportunityDTO dto) throws HSException {
        return ResponseEntity.ok(opportunityService.update(dto));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<OpportunityDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) throws HSException {
        return ResponseEntity.ok(opportunityService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) throws HSException {
        opportunityService.delete(id);
        return ResponseEntity.ok(new ResponseDTO("OPPORTUNITY_DELETED"));
    }
}
