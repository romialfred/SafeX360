package com.minexpert.hns.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.dashboard.DashboardOhsDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.dashboard.DashboardService;

import lombok.RequiredArgsConstructor;

/**
 * Tableau de bord Santé & Sécurité au travail — agrégations RÉELLES.
 *
 * <p>La Gateway strip le préfixe {@code /hns/} : le mapping réel côté HS est
 * {@code /dashboard}. Le param {@code companyId} est injecté en query par
 * l'intercepteur Axios (mine active) et validé/clampé par le CompanyScopeFilter ;
 * {@code companyId} absent = vue consolidée toutes mines (réservée aux comptes
 * allMinesAccess, le filtre refuse sinon).</p>
 *
 * <p>Cet endpoint remplace une maquette dont les chiffres étaient inventés :
 * toute métrique sans source dans le modèle de données est renvoyée à
 * {@code null} et affichée « — », jamais à 0.</p>
 */
@RestController
@RequestMapping("/dashboard")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class DashboardAPI {

    private final DashboardService dashboardService;

    /**
     * @param year année de référence ; omis = année courante.
     */
    @GetMapping("/ohs")
    public ResponseEntity<DashboardOhsDTO> getOhsDashboard(@RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Integer year) throws HSException {
        return new ResponseEntity<>(dashboardService.getOhsDashboard(companyId, year), HttpStatus.OK);
    }
}
