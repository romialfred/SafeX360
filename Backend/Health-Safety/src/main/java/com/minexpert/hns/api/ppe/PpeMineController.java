package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.EmpConsumptionDTO;
import com.minexpert.hns.service.ppe.PpeMineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Page « Mes EPI ». Le comparatif conso/coût par département / poste / ensemble est
 * calculé côté client en croisant cette agrégation (par empId) avec les profils RH
 * (département & poste). Cloisonné par mine.
 */
@RestController
@CrossOrigin
@RequestMapping("/ppe-mine")
@RequiredArgsConstructor
public class PpeMineController {
    private final PpeMineService mineService;

    @GetMapping("/consumption")
    public ResponseEntity<List<EmpConsumptionDTO>> consumption(
            @RequestParam(required = false) Long companyId) {
        return ResponseEntity.ok(mineService.getConsumptionByEmployee(companyId));
    }
}
