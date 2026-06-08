package com.minexpert.hns.blast.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.blast.config.BlastRBACConfig;
import com.minexpert.hns.blast.dto.BlastDashboardDTO;
import com.minexpert.hns.blast.service.BlastDashboardService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints du tableau de bord Blast Management (P7).
 *
 * <p>Reservé en lecture seule (RBAC {@link BlastRBACConfig#BLAST_VIEW}). Ne
 * declenche aucun side-effect (pas d'envoi d'e-mail, pas d'evolution de statut).
 *
 * <p>Le frontend appelle ce point une fois au montage puis polle toutes les
 * 30 secondes pour rafraichir le compte a rebours et les KPI.
 */
@RestController
@RequestMapping("/blast/dashboard")
@CrossOrigin
@RequiredArgsConstructor
public class BlastDashboardController {

    private final BlastDashboardService service;

    /**
     * Retourne l'agregat consolide du tableau de bord pour une mine donnee.
     *
     * @param mineId identifiant du site (multi-tenant). Obligatoire.
     * @return 200 + {@link BlastDashboardDTO} ; 400 si {@code mineId} est nul
     *         (geree par l'IllegalArgumentException du service).
     */
    @PreAuthorize("hasAuthority('" + BlastRBACConfig.BLAST_VIEW + "')")
    @GetMapping("/summary")
    public ResponseEntity<BlastDashboardDTO> summary(@RequestParam("mineId") Long mineId) {
        return new ResponseEntity<>(service.getSummary(mineId), HttpStatus.OK);
    }
}
