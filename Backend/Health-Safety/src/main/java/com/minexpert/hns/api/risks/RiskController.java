package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.risks.RiskDTO;
import com.minexpert.hns.dto.risks.RiskOverviewResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.RiskService;
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
    public ResponseEntity<RiskDTO> create(@RequestBody RiskDTO dto) throws HSException {
        return ResponseEntity.ok(riskService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<RiskDTO> update(@RequestBody RiskDTO dto) throws HSException {
        return ResponseEntity.ok(riskService.update(dto));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<RiskDTO> updateStatus(@PathVariable Long id, @RequestParam String status) throws HSException {
        return ResponseEntity.ok(riskService.updateStatus(id, status));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<RiskDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(riskService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<RiskDTO>> getAll() throws HSException {
        return ResponseEntity.ok(riskService.getAll());
    }

    @GetMapping("/withRiskLevel")
    public ResponseEntity<List<RiskDTO>> getAllWithRiskLevel() throws HSException {
        return ResponseEntity.ok(riskService.getAllWithRiskLevel());
    }

    @GetMapping("/search")
    public ResponseEntity<List<RiskDTO>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, name = "q") String q) throws HSException {
        return ResponseEntity.ok(riskService.search(status, departmentId, ownerId, from, to, q));
    }

    @GetMapping("/overview")
    public ResponseEntity<RiskOverviewResponse> overview(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, name = "q") String q) throws HSException {
        return ResponseEntity.ok(riskService.getOverview(status, departmentId, ownerId, from, to, q));
    }
}
