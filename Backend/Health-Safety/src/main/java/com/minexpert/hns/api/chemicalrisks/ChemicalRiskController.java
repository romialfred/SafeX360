package com.minexpert.hns.api.chemicalrisks;

import com.minexpert.hns.dto.chemicalrisks.ChemicalRiskDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.chemicalrisks.ChemicalRiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/chemical-risks")
@RequiredArgsConstructor
public class ChemicalRiskController {
    private final ChemicalRiskService chemicalRiskService;

    @PostMapping("/create")
    public ResponseEntity<ChemicalRiskDTO> create(@RequestBody ChemicalRiskDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(chemicalRiskService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ChemicalRiskDTO> update(@RequestBody ChemicalRiskDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(chemicalRiskService.update(dto, companyId));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<ChemicalRiskDTO> updateStatus(@PathVariable Long id, @RequestParam String status,
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(chemicalRiskService.updateStatus(id, status, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ChemicalRiskDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(chemicalRiskService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ChemicalRiskDTO>> getAll(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(chemicalRiskService.getAll(companyId));
    }
}
