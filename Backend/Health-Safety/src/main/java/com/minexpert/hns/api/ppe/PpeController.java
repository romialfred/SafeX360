package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ppe")
@RequiredArgsConstructor
public class PpeController {
    private final PpeService ppeService;

    @PostMapping("/create")
    public ResponseEntity<PpeDTO> create(@RequestBody PpeDTO dto) throws HSException {
        return ResponseEntity.ok(ppeService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeDTO> update(@RequestBody PpeDTO dto) throws HSException {
        return ResponseEntity.ok(ppeService.update(dto));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(ppeService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeDTO>> getAll() throws HSException {
        return ResponseEntity.ok(ppeService.getAllStocks());
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<PpeDTO>> getActive() throws HSException {
        return ResponseEntity.ok(ppeService.getActiveStocks());
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<Void> activate(@PathVariable Long id) throws HSException {
        ppeService.activateStock(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) throws HSException {
        ppeService.deactivateStock(id);
        return ResponseEntity.ok().build();
    }

    /** Get PPE items whose current stock is below the minimum threshold */
    @GetMapping("/getLowStock")
    public ResponseEntity<List<PpeDTO>> getLowStock() throws HSException {
        return ResponseEntity.ok(ppeService.getLowStock());
    }
}
