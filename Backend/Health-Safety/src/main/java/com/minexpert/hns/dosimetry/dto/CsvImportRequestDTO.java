package com.minexpert.hns.dosimetry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Options de declenchement d'un import CSV de resultats dosimetriques.
 *
 * <p>Le contenu binaire du fichier (octets) est transmis hors-DTO (multipart) : ce DTO porte
 * uniquement les parametres d'execution. Il est utilise lors du POST {@code /import/execute}
 * via @RequestParam afin de ne pas mixer multipart et JSON.
 *
 * <ul>
 *   <li>{@code mineId} : isolation logique - les workers cibles doivent appartenir a cette mine.</li>
 *   <li>{@code skipDuplicates} : si vrai, les lignes dont (worker, period) possede deja un
 *       DoseRecord actif sont SKIPPED (et comptees dans skippedCount). Si faux, elles
 *       deviennent des erreurs bloquantes (errorCount).</li>
 *   <li>{@code actorId} : id de l'utilisateur effectuant l'import (audit + recordedBy).</li>
 * </ul>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CsvImportRequestDTO {

    private Long mineId;
    private boolean skipDuplicates;
    private Long actorId;
}
