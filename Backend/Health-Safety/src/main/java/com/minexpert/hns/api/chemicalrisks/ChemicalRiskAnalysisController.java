package com.minexpert.hns.api.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskAnalysisDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.chemicalrisks.ChemicalRiskAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chemical-risks/analysis")
@RequiredArgsConstructor
public class ChemicalRiskAnalysisController {
    private final ChemicalRiskAnalysisService analysisService;

    @PostMapping("/create")
    public ResponseEntity<ChemicalRiskAnalysisDTO> create(@RequestBody ChemicalRiskAnalysisDTO dto) throws HSException {
        return ResponseEntity.ok(analysisService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ChemicalRiskAnalysisDTO> update(@RequestBody ChemicalRiskAnalysisDTO dto) throws HSException {
        return ResponseEntity.ok(analysisService.update(dto));
    }

    @GetMapping("/risk/{riskId}")
    public ResponseEntity<List<ChemicalRiskAnalysisDTO>> getByRisk(@PathVariable Long riskId) throws HSException {
        return ResponseEntity.ok(analysisService.getByRiskId(riskId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ChemicalRiskAnalysisDTO>> getAll() throws HSException {
        return ResponseEntity.ok(analysisService.getAll());
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ChemicalRiskAnalysisDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(analysisService.getById(id));
    }
}
