package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload générique pour les transitions de cycle SOS (LOT 48 Phase 3.a).
 *
 * <p>Champs optionnels selon le type de transition :</p>
 * <ul>
 *   <li>{@code rescueTeamId} : pour dispatch</li>
 *   <li>{@code note} : commentaire libre</li>
 *   <li>{@code falseAlarmReason} : pour false-alarm</li>
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosTransitionRequest {
    private Long rescueTeamId;
    private String note;
    private String falseAlarmReason;
}
