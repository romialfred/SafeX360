package com.minexpert.hns.api.emergency.dto;

import java.util.List;

import com.minexpert.hns.api.emergency.enums.CheckInStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pointage EN LOT de l'appel nominatif (LOT 63).
 *
 * <p>Le centre de contrôle marque souvent plusieurs employés d'un coup (une
 * équipe entière arrivée au point de rassemblement, un service en congé…).
 * Passer par l'endpoint unitaire imposerait N requêtes ET N diffusions
 * WebSocket : sous évacuation, c'est exactement ce qu'il ne faut pas faire.</p>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BulkCheckInRequest {

    /** Point de rassemblement commun (optionnel, surchargeable par entrée). */
    private Long assemblyPointId;

    /** Note commune appliquée aux entrées qui n'en portent pas. */
    private String note;

    private List<Entry> entries;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Entry {
        private Long employeeId;
        private CheckInStatus status;
        private String note;
        private Long assemblyPointId;
    }
}
