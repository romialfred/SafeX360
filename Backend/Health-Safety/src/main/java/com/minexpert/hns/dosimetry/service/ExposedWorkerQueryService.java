package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.ExposedWorkerDetailDTO;
import com.minexpert.hns.dosimetry.dto.ExposedWorkerListItemDTO;
import com.minexpert.hns.dosimetry.dto.SearchFiltersDTO;

/**
 * Service de requetes metier sur le Registre des travailleurs exposes.
 *
 * <p>Sert le frontend Registre (liste paginee + filtres) et la vue Detail 360. Distinct du
 * service CRUD historique ({@link ExposedWorkerService}) pour separer la couche query
 * read-only (avec joins, projections, RBAC) du CRUD ecriture.
 */
public interface ExposedWorkerQueryService {

    /**
     * Recherche multi-criteres sur le Registre. Tous les criteres de SearchFiltersDTO sont
     * optionnels (un filtre null est ignore). Le tri par defaut est employeeId ASC.
     *
     * <p>Le ratio annualHp10 / regulatoryLimit applicable a la categorie de personne du worker
     * est calcule par {@link #calculateExposureLevel(Double, Double)} et expose dans le DTO.
     */
    List<ExposedWorkerListItemDTO> searchWorkers(SearchFiltersDTO filters);

    /**
     * Fiche 360 d'un travailleur. Trace automatiquement un DosimetryAuditLog avec action
     * {@code VIEW_NOMINATIVE} (RGPD art. 30 + AIEA GSR Part 3 §3.106).
     *
     * @param workerId      id du travailleur expose
     * @param userId        id de l'utilisateur appelant (pour audit)
     * @param permissions   chaine CSV des permissions de l'appelant (pour gating MEDECIN)
     */
    ExposedWorkerDetailDTO getDetail(Long workerId, Long userId, String permissions);

    /**
     * Calcule le niveau d'exposition d'un travailleur en fonction du ratio entre son cumul
     * annuel Hp(10) et la limite reglementaire applicable.
     *
     * <ul>
     *   <li>GREEN  : annualHp10 &lt; 50% de regulatoryLimit</li>
     *   <li>YELLOW : 50% &lt;= annualHp10 &lt; 75%</li>
     *   <li>ORANGE : 75% &lt;= annualHp10 &lt; 100%</li>
     *   <li>RED    : annualHp10 &gt;= 100%</li>
     * </ul>
     *
     * @return null si une des entrees est null/inferieure ou egale a 0, sinon GREEN/YELLOW/ORANGE/RED
     */
    String calculateExposureLevel(Double annualHp10, Double regulatoryLimit);

    /**
     * Genere un export CSV des travailleurs d'une mine (matricule, nom, categorie, cumul
     * annuel, glissant 5y, vie entiere, niveau). Le contenu est retourne en string ASCII +
     * UTF-8 sans BOM, separateur ; (compat. Excel FR).
     */
    String exportCsv(Long mineId);
}
