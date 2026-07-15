package com.minexpert.hns.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.response.LastInspectionDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.inspections.GeneralInspectionService;

import lombok.RequiredArgsConstructor;

/**
 * Requêtes transverses sur les inspections (hors workflow / CRUD principal).
 *
 * <p>La Gateway strip le préfixe {@code /hns/} : le mapping réel côté HS est
 * {@code /inspections}. {@code companyId} injecté en query par l'intercepteur
 * Axios (mine active).</p>
 */
@RestController
@RequestMapping("/inspections")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class InspectionQueryAPI {

    private final GeneralInspectionService generalInspectionService;

    /**
     * Dernière inspection pour une cible ({@code targetType} =
     * EQUIPMENT|LOCATION|PROCEDURE, {@code targetRefId} = id de la cible).
     * 200 + {@link LastInspectionDTO} si trouvée, 204 sinon.
     */
    @GetMapping("/last")
    public ResponseEntity<LastInspectionDTO> getLastInspection(
            @RequestParam String targetType,
            @RequestParam Long targetRefId,
            @RequestParam(required = false) Long companyId) throws HSException {
        LastInspectionDTO dto = generalInspectionService.getLastInspection(targetType, targetRefId, companyId);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }
}
