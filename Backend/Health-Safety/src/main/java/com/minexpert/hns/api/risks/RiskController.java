package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.risks.RiskDTO;
import com.minexpert.hns.dto.risks.RiskOverviewResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.RiskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/risks")
@RequiredArgsConstructor
public class RiskController {
    private final RiskService riskService;

    @PostMapping("/create")
    public ResponseEntity<RiskDTO> create(@Valid @RequestBody RiskDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(riskService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<RiskDTO> update(@Valid @RequestBody RiskDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskService.update(dto, companyId));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<RiskDTO> updateStatus(@PathVariable Long id, @RequestParam String status,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskService.updateStatus(id, status, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<RiskDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<RiskDTO>> getAll(@RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskService.getAll(companyId));
    }

    @GetMapping("/withRiskLevel")
    public ResponseEntity<List<RiskDTO>> getAllWithRiskLevel(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(riskService.getAllWithRiskLevel(companyId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<RiskDTO>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskService.search(status, departmentId, ownerId, from, to, q, companyId));
    }

    @GetMapping("/overview")
    public ResponseEntity<RiskOverviewResponse> overview(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskService.getOverview(status, departmentId, ownerId, from, to, q, companyId));
    }
}
