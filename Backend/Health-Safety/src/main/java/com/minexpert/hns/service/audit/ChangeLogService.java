package com.minexpert.hns.service.audit;

import java.util.List;

import com.minexpert.hns.dto.audit.ChangeLogDTO;

/**
 * Journal d'audit champ-par-champ réutilisable (ISO 45001 §7.5.3).
 * Constantes d'{@code entityType} centralisées pour éviter les chaînes magiques.
 */
public interface ChangeLogService {

    String INCIDENT = "INCIDENT";
    String CORRECTIVE_ACTION = "CORRECTIVE_ACTION";
    String INVESTIGATION = "INVESTIGATION";

    /**
     * Enregistre un changement de champ. L'acteur (« QUI ») est dérivé de
     * l'identité AUTHENTIFIÉE (SecurityContext / X-User-Id), jamais d'un paramètre
     * client — traçabilité non répudiable. No-op si {@code oldValue} et
     * {@code newValue} sont identiques (aucun changement réel à tracer).
     */
    void record(String entityType, Long entityId, Long companyId,
            String field, String oldValue, String newValue);

    /** Journal d'une entité (plus récent d'abord), noms d'acteurs résolus. */
    List<ChangeLogDTO> list(String entityType, Long entityId, Long companyId);
}
