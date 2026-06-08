package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Body de la requete {@code POST /hns/blast/reschedule/{id}} (P5).
 *
 * <p>Format JSON canonique :
 * <pre>{
 *   "newScheduledAt": "2026-06-20T15:30:00",
 *   "reason":         "Riverains preavis 48h"
 * }</pre>
 *
 * <p>Format ISO {@code LocalDateTime} (sans timezone : le fuseau de la mine
 * est porte par {@code blast.timezone} cote backend). Les anciens query
 * params {@code ?newScheduledAt=...&reason=...} restent acceptes ; voir
 * {@code BlastController#reschedule}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastRescheduleRequestDTO {

    /** Nouvelle heure de tir prevue, format ISO LocalDateTime. Obligatoire. */
    private String newScheduledAt;

    /** Raison du report. Obligatoire (validee cote service). */
    private String reason;
}
