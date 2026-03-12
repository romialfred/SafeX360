package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeStockDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ppe-stock")
@RequiredArgsConstructor
public class PpeStockController {
    private final PpeStockService stockService;

    @PostMapping("/create")
    public ResponseEntity<PpeStockDTO> create(@RequestBody PpeStockDTO dto)
            throws HSException {
        return ResponseEntity.ok(stockService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeStockDTO> update(@RequestBody PpeStockDTO dto) throws HSException {
        return ResponseEntity.ok(stockService.update(dto));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeStockDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(stockService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeStockDTO>> getAll() throws HSException {
        return ResponseEntity.ok(stockService.getAllStocks());
    }

    @GetMapping("/ppe/{ppeId}")
    public ResponseEntity<List<PpeStockDTO>> getByPpe(@PathVariable Long ppeId) throws HSException {
        return ResponseEntity.ok(stockService.getByPpeId(ppeId));
    }
}
