package com.minexpert.hns.api.risks;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.risks.RiskControlDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.risks.RiskControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/risks/controls")
@RequiredArgsConstructor
public class RiskControlController {
    private final RiskControlService riskControlService;

    @PostMapping("/create")
    public ResponseEntity<RiskControlDTO> create(@RequestBody RiskControlDTO dto) throws HSException {
        return ResponseEntity.ok(riskControlService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<RiskControlDTO>> listByRisk(
            @RequestParam String sourceType,
            @RequestParam Long riskId) throws HSException {
        return ResponseEntity.ok(riskControlService.listByRisk(sourceType, riskId));
    }

    @PutMapping("/update")
    public ResponseEntity<RiskControlDTO> update(@RequestBody RiskControlDTO dto) throws HSException {
        return ResponseEntity.ok(riskControlService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO> delete(@PathVariable Long id) throws HSException {
        riskControlService.delete(id);
        return ResponseEntity.ok(new ResponseDTO("RISK_CONTROL_DELETED"));
    }
}
