package com.minexpert.hns.dosimetry.dto;

import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.dosimetry.enums.DoseSource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resultat du preview d'un import CSV (analyse sans persistence).
 *
 * <p>Renvoye par {@code CsvImportService.preview(...)} pour permettre au frontend de
 * presenter a l'utilisateur la classification complete des lignes AVANT execution :
 * - lignes valides (importables tel quel) ;
 * - lignes avec warning (importables mais a inspecter, ex. valeur > 50 mSv) ;
 * - lignes en erreur (matricule inconnu, format invalide, doublon...).
 *
 * <p>L'idempotence est gerees au niveau {@link CsvImportResultDTO} via importId : le preview
 * fournit l'importId fingerprint stable du contenu CSV pour que le frontend puisse detecter
 * un re-soumission identique.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CsvImportPreviewDTO {

    /**
     * Fingerprint stable du contenu CSV (hash + taille). Permet de detecter une re-soumission
     * identique cote frontend ET cote serveur (idempotence : meme importId = meme contenu).
     */
    private String importId;

    private int totalRows;
    private int validRows;
    private int warningRowsCount;
    private int errorRowsCount;

    /** Lignes parsees avec succes et pretes a etre persistees. */
    @Builder.Default
    private List<PreviewRow> validRowsDetail = new ArrayList<>();

    /** Lignes valides MAIS comportant un avertissement (ex. valeur > 50 mSv). */
    @Builder.Default
    private List<PreviewRow> warningRows = new ArrayList<>();

    /** Lignes rejetees (matricule inconnu, format invalide, doublon). */
    @Builder.Default
    private List<PreviewRow> errorRows = new ArrayList<>();

    /**
     * Detail d'une ligne CSV apres parsing + classification.
     *
     * <p>{@code status} prend l'une des valeurs :
     * <ul>
     *   <li>VALID : ligne prete a etre importee.</li>
     *   <li>WARNING_VALUE_TOO_HIGH : valeur Hp(10) {@literal >} 50 mSv (annual limit category B).</li>
     *   <li>WORKER_NOT_FOUND : aucun ExposedWorker actif n'a pour employeeId la valeur matricule.</li>
     *   <li>INVALID_FORMAT : period mal formee, valeurs non numeriques, source inconnue, etc.</li>
     *   <li>DUPLICATE : un DoseRecord actif existe deja pour (worker, period).</li>
     * </ul>
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreviewRow {
        /** Numero de la ligne dans le CSV (1-indexe, l'entete est 1). */
        private int lineNumber;
        /** Valeur brute matricule (tel que lu depuis le CSV). */
        private String matricule;
        /** Worker resolu via findByEmployeeId(matricule), null si WORKER_NOT_FOUND. */
        private Long workerId;
        private String period;
        private Double hp10;
        private Double hp007;
        private Double hp3;
        private DoseSource source;
        private boolean belowDetection;
        private String notes;
        private String attachmentUrl;
        private String status;
        /** Message lisible (cause de l'erreur ou warning). */
        private String message;
    }
}
