package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/ppe")
@RequiredArgsConstructor
public class PpeController {
    private final PpeService ppeService;

    @PostMapping("/create")
    public ResponseEntity<PpeDTO> create(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(ppeService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeDTO> update(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(ppeService.update(dto, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(ppeService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeDTO>> getAll(@RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(ppeService.getAllStocks(companyId));
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<PpeDTO>> getActive(@RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(ppeService.getActiveStocks(companyId));
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<Void> activate(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        ppeService.activateStock(id, companyId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        ppeService.deactivateStock(id, companyId);
        return ResponseEntity.ok().build();
    }

    /** Get PPE items whose current stock is below the minimum threshold */
    @GetMapping("/getLowStock")
    public ResponseEntity<List<PpeDTO>> getLowStock(@RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(ppeService.getLowStock(companyId));
    }
}
