package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeStockDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/ppe-stock")
@RequiredArgsConstructor
public class PpeStockController {
    private final PpeStockService stockService;

    @PostMapping("/create")
    public ResponseEntity<PpeStockDTO> create(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeStockDTO dto)
            throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(stockService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeStockDTO> update(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeStockDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(stockService.update(dto, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeStockDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(stockService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeStockDTO>> getAll(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(stockService.getAllStocks(companyId));
    }

    @GetMapping("/ppe/{ppeId}")
    public ResponseEntity<List<PpeStockDTO>> getByPpe(@PathVariable Long ppeId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(stockService.getByPpeId(ppeId, companyId));
    }
}
