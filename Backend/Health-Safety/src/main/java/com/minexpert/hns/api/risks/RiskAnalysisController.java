package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.risks.RiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.RiskAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/risks/analysis")
@RequiredArgsConstructor
public class RiskAnalysisController {
    private final RiskAnalysisService analysisService;

    @PostMapping("/create")
    public ResponseEntity<RiskAnalysisDTO> create(@Valid @RequestBody RiskAnalysisDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(analysisService.create(dto, companyId));
    }

    @PutMapping("/update")
    public ResponseEntity<RiskAnalysisDTO> update(@Valid @RequestBody RiskAnalysisDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(analysisService.update(dto, companyId));
    }

    @GetMapping("/risk/{riskId}")
    public ResponseEntity<List<RiskAnalysisDTO>> getByRisk(@PathVariable Long riskId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(analysisService.getByRiskId(riskId, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<RiskAnalysisDTO>> getAll(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(analysisService.getAll(companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<RiskAnalysisDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(analysisService.getById(id, companyId));
    }
}
