package com.minexpert.hns.api.featureflags;

import com.minexpert.hns.dto.featureflags.CompanyModuleActivationDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.featureflags.CompanyModuleActivationService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Activation des modules PAR MINE (cloisonnement tenant), distinct du flag global
 * {@code /modules}. Consomme par « Gestion des Modules » (matrice mine x module),
 * la grille de creation d'utilisateurs et le menu.
 */
@RestController
@CrossOrigin
@RequestMapping("/modules/company")
@RequiredArgsConstructor
public class CompanyModuleActivationController {

    private final CompanyModuleActivationService service;

    /** Toutes les desactivations explicites (charge la matrice de la page Modules). */
    @GetMapping("/activations")
    public ResponseEntity<List<CompanyModuleActivationDTO>> activations() {
        return ResponseEntity.ok(service.allOverrides());
    }

    /** Statut de chaque module du catalogue pour une mine (defaut ACTIF). */
    @GetMapping("/{companyId}/statuses")
    public ResponseEntity<List<CompanyModuleActivationDTO>> statuses(@PathVariable Long companyId) {
        return ResponseEntity.ok(service.statusesForCompany(companyId));
    }

    /** Cles des modules ACTIFS pour la mine (grille de creation + menu). */
    @GetMapping("/{companyId}/active")
    public ResponseEntity<List<String>> active(@PathVariable Long companyId) {
        return ResponseEntity.ok(service.activeModulesForCompany(companyId));
    }

    /** Active/desactive un module pour une mine. */
    @PutMapping("/{companyId}/{module}")
    public ResponseEntity<CompanyModuleActivationDTO> setStatus(
            @PathVariable Long companyId,
            @PathVariable String module,
            @RequestParam Status status) throws HSException {
        return ResponseEntity.ok(service.setStatus(companyId, module, status));
    }
}
