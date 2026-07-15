package com.minexpert.hns.api.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.chemicalrisks.ChemicalRiskAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/chemical-risks/analysis")
@RequiredArgsConstructor
public class ChemicalRiskAnalysisController {
    private final ChemicalRiskAnalysisService analysisService;

    @PostMapping("/create")
    public ResponseEntity<ChemicalRiskAnalysisDTO> create(@RequestBody ChemicalRiskAnalysisDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(analysisService.create(dto, companyId));
    }

    @PutMapping("/update")
    public ResponseEntity<ChemicalRiskAnalysisDTO> update(@RequestBody ChemicalRiskAnalysisDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(analysisService.update(dto, companyId));
    }

    @GetMapping("/risk/{riskId}")
    public ResponseEntity<List<ChemicalRiskAnalysisDTO>> getByRisk(@PathVariable Long riskId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(analysisService.getByRiskId(riskId, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ChemicalRiskAnalysisDTO>> getAll(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(analysisService.getAll(companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ChemicalRiskAnalysisDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(analysisService.getById(id, companyId));
    }
}
