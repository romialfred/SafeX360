package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.risks.RiskControlDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.RiskControlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/risks/controls")
@RequiredArgsConstructor
public class RiskControlController {
    private final RiskControlService riskControlService;

    @PostMapping("/create")
    public ResponseEntity<RiskControlDTO> create(@Valid @RequestBody RiskControlDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(riskControlService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<RiskControlDTO>> listByRisk(
            @RequestParam String sourceType,
            @RequestParam Long riskId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskControlService.listByRisk(sourceType, riskId, companyId));
    }

    @PutMapping("/update")
    public ResponseEntity<RiskControlDTO> update(@Valid @RequestBody RiskControlDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(riskControlService.update(dto, companyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        riskControlService.delete(id, companyId);
        return ResponseEntity.ok(new ResponseDTO("RISK_CONTROL_DELETED"));
    }
}
