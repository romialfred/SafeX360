package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resultat de l'execution d'un import CSV.
 *
 * <p>Strategie d'idempotence : {@code importId} est un fingerprint stable (hash + taille)
 * du contenu CSV. Avant execution, le service consulte le journal d'audit pour repercuter
 * un import deja realise avec le meme importId, dans une fenetre de 24h ; le cas echeant
 * il retourne ce DTO avec {@code idempotentReplay = true} et {@code importedCount = 0}
 * sans creer de nouveau DoseRecord. La verification ligne-a-ligne (DUPLICATE sur worker +
 * period) constitue une seconde garde-fou.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CsvImportResultDTO {

    /** Fingerprint stable du contenu CSV (hash + taille). Repris dans l'audit log. */
    private String importId;

    private int totalRows;
    private int importedCount;
    private int skippedCount;
    private int errorCount;

    /** True si l'import a deja ete realise (meme importId) - aucun nouveau record cree. */
    private boolean idempotentReplay;

    /** Horodatage UTC de l'execution serveur. */
    private LocalDateTime executedAt;

    /**
     * Erreurs detaillees (matricule introuvable, format, doublon hors skipDuplicates...).
     * Chaque entree precise la ligne CSV concernee et la raison.
     */
    @Builder.Default
    private List<ImportError> errors = new ArrayList<>();

    /**
     * Detail d'une erreur d'import au niveau d'une ligne.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportError {
        private int lineNumber;
        private String matricule;
        private String period;
        private String status;
        private String message;
    }
}
