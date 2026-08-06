package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeStocktakeDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeStocktakeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Inventaire physique EPI (incrément 5). Le comptage se crée en brouillon puis se
 * valide ; la validation réconcilie le stock via le journal de mouvements.
 * {@code companyId} = mine active (header) ; {@code X-User-Id} = opérateur (compteur).
 */
@RestController
@CrossOrigin
@RequestMapping("/ppe-stocktake")
@RequiredArgsConstructor
public class PpeStocktakeController {
    private final PpeStocktakeService stocktakeService;

    @PostMapping("/create")
    public ResponseEntity<PpeStocktakeDTO> create(
            @RequestParam(required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false) Long actorId,
            @Valid @RequestBody PpeStocktakeDTO dto) throws HSException {
        return ResponseEntity.ok(stocktakeService.create(dto, companyId, actorId));
    }

    @PutMapping("/validate/{id}")
    public ResponseEntity<PpeStocktakeDTO> validate(
            @PathVariable Long id,
            @RequestParam(required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false) Long actorId) throws HSException {
        return ResponseEntity.ok(stocktakeService.validate(id, companyId, actorId));
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<PpeStocktakeDTO> cancel(
            @PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(stocktakeService.cancel(id, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeStocktakeDTO> getById(
            @PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(stocktakeService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeStocktakeDTO>> getAll(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(stocktakeService.getAll(companyId));
    }
}
