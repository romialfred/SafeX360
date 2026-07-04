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
    public ResponseEntity<RiskAnalysisDTO> create(@Valid @RequestBody RiskAnalysisDTO dto) throws HSException {
        return ResponseEntity.ok(analysisService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<RiskAnalysisDTO> update(@Valid @RequestBody RiskAnalysisDTO dto) throws HSException {
        return ResponseEntity.ok(analysisService.update(dto));
    }

    @GetMapping("/risk/{riskId}")
    public ResponseEntity<List<RiskAnalysisDTO>> getByRisk(@PathVariable Long riskId) throws HSException {
        return ResponseEntity.ok(analysisService.getByRiskId(riskId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<RiskAnalysisDTO>> getAll() throws HSException {
        return ResponseEntity.ok(analysisService.getAll());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<RiskAnalysisDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(analysisService.getById(id));
    }
}
