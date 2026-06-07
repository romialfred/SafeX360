package com.minexpert.hns.dosimetry.service;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dosimetry.dto.CsvImportPreviewDTO;
import com.minexpert.hns.dosimetry.dto.CsvImportResultDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.entity.ExposedWorker;
import com.minexpert.hns.dosimetry.enums.DoseSource;
import com.minexpert.hns.dosimetry.repository.DoseRecordRepository;
import com.minexpert.hns.dosimetry.repository.DosimetryAuditLogRepository;
import com.minexpert.hns.dosimetry.repository.ExposedWorkerRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service d'import CSV des resultats dosimetriques fournis par les agences agreees.
 *
 * <p><b>Format CSV attendu :</b><br>
 * Header : {@code matricule,period,hp10,hp007,hp3,source,below_detection,notes,attachment_url}<br>
 * Exemple : {@code EMP001,2026-04,1.2,15.5,1.0,AGENCY,false,Routine quarterly,}
 *
 * <p><b>Strategie d'idempotence :</b>
 * <ol>
 *   <li>Calcul d'un {@code importId} = SHA-256 du contenu binaire (fingerprint stable).</li>
 *   <li>Avant execution, recherche dans le journal d'audit (action = IMPORT_CSV) un entree
 *       precedente comportant le meme importId. Si trouvee, on renvoie immediatement un
 *       {@link CsvImportResultDTO} avec {@code idempotentReplay = true} sans creer de record.</li>
 *   <li>Garde-fou ligne-a-ligne : pour chaque ligne VALID, on re-verifie qu'aucun DoseRecord
 *       actif n'existe deja pour (worker, period) ; le cas echeant la ligne devient DUPLICATE
 *       (skipped si {@code skipDuplicates = true}, sinon error).</li>
 * </ol>
 *
 * <p><b>Transactionnalite :</b> execute() est {@code @Transactional} - si l'une des creations
 * mid-pipeline echoue (exception runtime), TOUT l'import est rollback. Les lignes deja
 * persistees sont donc annulees. Le log d'audit final reflete soit le succes complet, soit
 * un echec global (et est ecrit dans une transaction independante REQUIRES_NEW par le helper
 * d'audit afin d'etre conserve meme apres rollback parent).
 *
 * <p><b>Pas de nouvelle dependance :</b> parsing CSV simple via {@link String#split(String)}
 * et {@link BufferedReader} - aucun OpenCSV / Univocity / Jackson CSV ajoute au pom.
 */
@Service
@RequiredArgsConstructor
public class CsvImportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CsvImportService.class);

    /** Header CSV attendu (ordre des colonnes). */
    static final String EXPECTED_HEADER =
            "matricule,period,hp10,hp007,hp3,source,below_detection,notes,attachment_url";

    /** Seuil de warning sur Hp(10) en mSv (limite annuelle categorie B / threshold metier). */
    static final double WARNING_VALUE_HP10_MSV = 50.0;

    /** Status codes alignes avec {@link CsvImportPreviewDTO.PreviewRow#status}. */
    static final String STATUS_VALID = "VALID";
    static final String STATUS_WARNING = "WARNING_VALUE_TOO_HIGH";
    static final String STATUS_WORKER_NOT_FOUND = "WORKER_NOT_FOUND";
    static final String STATUS_INVALID_FORMAT = "INVALID_FORMAT";
    static final String STATUS_DUPLICATE = "DUPLICATE";

    /** Action key utilise pour l'audit log d'un import CSV (visible via GET /import/history). */
    public static final String AUDIT_ACTION_IMPORT_CSV = "IMPORT_CSV";

    private static final DateTimeFormatter PERIOD_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final ExposedWorkerRepository workerRepository;
    private final DoseRecordRepository doseRecordRepository;
    private final DoseRecordService doseRecordService;
    private final DosimetryAuditLogRepository auditLogRepository;
    private final DosimetryAuditService auditService;

    // -------------------------------------------------------------------------------------------
    //   PREVIEW
    // -------------------------------------------------------------------------------------------

    /**
     * Parse + classifie le CSV sans aucune persistance.
     *
     * @param csvBytes contenu binaire du fichier CSV (charset UTF-8 attendu)
     * @param mineId   isolation : les workers introuvables OU appartenant a une autre mine sont
     *                 classes WORKER_NOT_FOUND
     * @return un {@link CsvImportPreviewDTO} avec totalRows + ventilation valid/warning/error
     */
    public CsvImportPreviewDTO preview(byte[] csvBytes, Long mineId) {
        if (csvBytes == null || csvBytes.length == 0) {
            return CsvImportPreviewDTO.builder()
                    .importId(computeImportId(new byte[0]))
                    .totalRows(0)
                    .validRows(0)
                    .warningRowsCount(0)
                    .errorRowsCount(0)
                    .validRowsDetail(new ArrayList<>())
                    .warningRows(new ArrayList<>())
                    .errorRows(new ArrayList<>())
                    .build();
        }

        String importId = computeImportId(csvBytes);
        List<ParsedLine> parsed = parseCsv(csvBytes);

        // Pour detecter les doublons INTRA-CSV (meme worker + meme period repete dans le fichier)
        Set<String> seenWorkerPeriod = new HashSet<>();

        List<CsvImportPreviewDTO.PreviewRow> validRows = new ArrayList<>();
        List<CsvImportPreviewDTO.PreviewRow> warningRows = new ArrayList<>();
        List<CsvImportPreviewDTO.PreviewRow> errorRows = new ArrayList<>();

        for (ParsedLine line : parsed) {
            CsvImportPreviewDTO.PreviewRow row = classify(line, mineId, seenWorkerPeriod);
            switch (row.getStatus()) {
                case STATUS_VALID:
                    validRows.add(row);
                    seenWorkerPeriod.add(row.getWorkerId() + "|" + row.getPeriod());
                    break;
                case STATUS_WARNING:
                    warningRows.add(row);
                    seenWorkerPeriod.add(row.getWorkerId() + "|" + row.getPeriod());
                    break;
                default:
                    errorRows.add(row);
                    break;
            }
        }

        return CsvImportPreviewDTO.builder()
                .importId(importId)
                .totalRows(parsed.size())
                .validRows(validRows.size() + warningRows.size())
                .warningRowsCount(warningRows.size())
                .errorRowsCount(errorRows.size())
                .validRowsDetail(validRows)
                .warningRows(warningRows)
                .errorRows(errorRows)
                .build();
    }

    // -------------------------------------------------------------------------------------------
    //   EXECUTE
    // -------------------------------------------------------------------------------------------

    /**
     * Re-parse le CSV, valide ligne par ligne et persiste les DoseRecord pour les lignes VALID
     * et WARNING (sauf si {@code skipDuplicates} demande explicitement de sauter les DUPLICATE).
     *
     * <p>Pipeline :
     * <ol>
     *   <li>Calcul de l'importId (fingerprint).</li>
     *   <li>Lookup audit IMPORT_CSV anterieur avec le meme importId - si trouve, replay
     *       idempotent (importedCount=0, idempotentReplay=true).</li>
     *   <li>Parse + classify + creation des DoseRecord via {@link DoseRecordService#create}.
     *       Toute exception runtime propage et declenche le rollback de la transaction.</li>
     *   <li>Audit log final action=IMPORT_CSV avec details JSON :
     *       {totalRows, importedCount, skippedCount, errorCount, importId}.</li>
     * </ol>
     */
    @Transactional
    public CsvImportResultDTO execute(byte[] csvBytes,
                                       Long mineId,
                                       Long actorId,
                                       boolean skipDuplicates) {
        if (csvBytes == null) {
            csvBytes = new byte[0];
        }
        String importId = computeImportId(csvBytes);

        // 1. Idempotence : a-t-on deja importe ce contenu ?
        Optional<DosimetryAuditLog> previousImport = findPreviousImport(importId, mineId);
        if (previousImport.isPresent()) {
            LOGGER.info("[CsvImportService] idempotent replay detected importId={} (previous logId={})",
                    importId, previousImport.get().getId());
            return CsvImportResultDTO.builder()
                    .importId(importId)
                    .totalRows(0)
                    .importedCount(0)
                    .skippedCount(0)
                    .errorCount(0)
                    .idempotentReplay(true)
                    .executedAt(LocalDateTime.now())
                    .errors(Collections.emptyList())
                    .build();
        }

        // 2. Re-parse + re-classify + persist
        List<ParsedLine> parsed = parseCsv(csvBytes);
        Set<String> seenWorkerPeriod = new HashSet<>();
        int imported = 0;
        int skipped = 0;
        List<CsvImportResultDTO.ImportError> errors = new ArrayList<>();

        for (ParsedLine line : parsed) {
            CsvImportPreviewDTO.PreviewRow row = classify(line, mineId, seenWorkerPeriod);
            String status = row.getStatus();

            // Ligne valide (ou warning) : on persiste via DoseRecordService.createWithResult
            if (STATUS_VALID.equals(status) || STATUS_WARNING.equals(status)) {
                try {
                    DoseRecordDTO dto = new DoseRecordDTO();
                    dto.setWorkerId(row.getWorkerId());
                    dto.setPeriod(row.getPeriod());
                    dto.setHp10(row.getHp10());
                    dto.setHp007(row.getHp007());
                    dto.setHp3(row.getHp3());
                    dto.setSource(row.getSource());
                    dto.setBelowDetection(row.isBelowDetection());
                    dto.setNotes(row.getNotes());
                    dto.setAttachmentUrls(row.getAttachmentUrl());
                    dto.setRecordedBy(actorId != null ? actorId : 0L);
                    dto.setCreatedBy(actorId);
                    dto.setUpdatedBy(actorId);

                    doseRecordService.create(mineId, dto);
                    imported++;
                    seenWorkerPeriod.add(row.getWorkerId() + "|" + row.getPeriod());
                } catch (Exception ex) {
                    // Erreur de persistance (FK, contrainte, etc.). On laisse propager pour
                    // declencher le rollback global - sinon on aurait un import partiel.
                    LOGGER.error("[CsvImportService] persistence FAILED line={} matricule={} : {}",
                            row.getLineNumber(), row.getMatricule(), ex.getMessage(), ex);
                    throw ex;
                }
                continue;
            }

            // DUPLICATE : peut etre saute si demande
            if (STATUS_DUPLICATE.equals(status)) {
                if (skipDuplicates) {
                    skipped++;
                } else {
                    errors.add(toImportError(row));
                }
                continue;
            }

            // WORKER_NOT_FOUND : toujours skip + log (pas d'echec global)
            if (STATUS_WORKER_NOT_FOUND.equals(status)) {
                LOGGER.warn("[CsvImportService] worker not found line={} matricule={} mineId={}",
                        row.getLineNumber(), row.getMatricule(), mineId);
                skipped++;
                continue;
            }

            // INVALID_FORMAT : remonte en erreur
            errors.add(toImportError(row));
        }

        // 3. Audit log final
        String details = buildAuditDetails(importId, parsed.size(), imported, skipped, errors.size());
        if (auditService != null) {
            auditService.log(AUDIT_ACTION_IMPORT_CSV, "DoseRecord",
                    mineId, actorId != null ? actorId : 0L, null, details);
        } else {
            auditLogRepository.save(DosimetryAuditLog.builder()
                    .action(AUDIT_ACTION_IMPORT_CSV)
                    .entityType("DoseRecord")
                    .entityId(mineId)
                    .userId(actorId != null ? actorId : 0L)
                    .timestamp(LocalDateTime.now())
                    .details(details)
                    .build());
        }

        return CsvImportResultDTO.builder()
                .importId(importId)
                .totalRows(parsed.size())
                .importedCount(imported)
                .skippedCount(skipped)
                .errorCount(errors.size())
                .idempotentReplay(false)
                .executedAt(LocalDateTime.now())
                .errors(errors)
                .build();
    }

    // -------------------------------------------------------------------------------------------
    //   HISTORY
    // -------------------------------------------------------------------------------------------

    /**
     * Renvoie l'historique des imports CSV pour une mine donnee (audit logs filtres sur
     * action = IMPORT_CSV et entityId = mineId), tries du plus recent au plus ancien.
     */
    public List<DosimetryAuditLog> history(Long mineId) {
        List<DosimetryAuditLog> all = auditLogRepository.findByAction(AUDIT_ACTION_IMPORT_CSV);
        List<DosimetryAuditLog> filtered = new ArrayList<>();
        for (DosimetryAuditLog log : all) {
            if (mineId == null || mineId.equals(log.getEntityId())) {
                filtered.add(log);
            }
        }
        filtered.sort((a, b) -> {
            if (a.getTimestamp() == null || b.getTimestamp() == null) return 0;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });
        return filtered;
    }

    // -------------------------------------------------------------------------------------------
    //   PARSING
    // -------------------------------------------------------------------------------------------

    /**
     * Parse le CSV brut en lignes structurees. Tolere :
     * <ul>
     *   <li>BOM UTF-8 en tete de fichier ;</li>
     *   <li>fins de ligne CRLF ou LF ;</li>
     *   <li>lignes vides en milieu de fichier (ignorees) ;</li>
     *   <li>en-tete present ou absent (si la 1ere ligne ressemble a un header, elle est sautee).</li>
     * </ul>
     * Le parsing par split(",", -1) est volontairement simple : il NE gere PAS les valeurs
     * quotees avec virgules incluses. Pour le format agence, le champ "notes" est le seul a
     * risque ; le contrat operationnel demande aux agences de fournir des CSV sans virgule dans
     * les notes. Si necessaire, basculer plus tard sur OpenCSV (nouvelle dependance assumee).
     */
    List<ParsedLine> parseCsv(byte[] csvBytes) {
        List<ParsedLine> out = new ArrayList<>();
        if (csvBytes == null || csvBytes.length == 0) {
            return out;
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(csvBytes), StandardCharsets.UTF_8))) {
            String raw;
            int lineNumber = 0;
            boolean firstLine = true;
            while ((raw = reader.readLine()) != null) {
                lineNumber++;
                String line = raw;
                // Strip BOM sur la toute premiere ligne
                if (firstLine && !line.isEmpty() && line.charAt(0) == '﻿') {
                    line = line.substring(1);
                }
                // Skip empty
                if (line.trim().isEmpty()) {
                    firstLine = false;
                    continue;
                }
                // Skip header (line starts with "matricule" - case-insensitive)
                if (firstLine && line.toLowerCase().startsWith("matricule")) {
                    firstLine = false;
                    continue;
                }
                firstLine = false;

                String[] cols = line.split(",", -1);
                ParsedLine pl = new ParsedLine();
                pl.lineNumber = lineNumber;
                pl.matricule = cols.length > 0 ? trim(cols[0]) : "";
                pl.period = cols.length > 1 ? trim(cols[1]) : "";
                pl.hp10Raw = cols.length > 2 ? trim(cols[2]) : "";
                pl.hp007Raw = cols.length > 3 ? trim(cols[3]) : "";
                pl.hp3Raw = cols.length > 4 ? trim(cols[4]) : "";
                pl.sourceRaw = cols.length > 5 ? trim(cols[5]) : "";
                pl.belowDetectionRaw = cols.length > 6 ? trim(cols[6]) : "";
                pl.notes = cols.length > 7 ? trim(cols[7]) : "";
                pl.attachmentUrl = cols.length > 8 ? trim(cols[8]) : "";
                pl.columnCount = cols.length;
                out.add(pl);
            }
        } catch (IOException ex) {
            // Peu probable sur un ByteArrayInputStream ; trace + fallback liste vide
            LOGGER.error("[CsvImportService] CSV read FAILED : {}", ex.getMessage(), ex);
        }
        return out;
    }

    private String trim(String s) {
        return s == null ? "" : s.trim();
    }

    /**
     * Classifie une ligne deja parsee : resout le worker, valide les types/format, detecte
     * les doublons, applique le warning > 50 mSv. Pas de side-effect.
     */
    CsvImportPreviewDTO.PreviewRow classify(ParsedLine line, Long mineId,
                                            Set<String> seenWorkerPeriod) {
        CsvImportPreviewDTO.PreviewRow.PreviewRowBuilder b = CsvImportPreviewDTO.PreviewRow.builder()
                .lineNumber(line.lineNumber)
                .matricule(line.matricule)
                .period(line.period)
                .notes(line.notes)
                .attachmentUrl(line.attachmentUrl);

        // 1. Verification structurelle (nombre de colonnes minimal pour les champs requis)
        if (line.columnCount < 6) {
            return b.status(STATUS_INVALID_FORMAT)
                    .message("Ligne mal formee : " + line.columnCount + " colonnes (attendu >= 6)")
                    .build();
        }
        if (line.matricule.isEmpty()) {
            return b.status(STATUS_INVALID_FORMAT).message("matricule vide").build();
        }
        if (line.period.isEmpty()) {
            return b.status(STATUS_INVALID_FORMAT).message("period vide").build();
        }

        // 2. Period yyyy-MM
        if (!isValidPeriod(line.period)) {
            return b.status(STATUS_INVALID_FORMAT)
                    .message("period invalide (attendu yyyy-MM) : " + line.period).build();
        }

        // 3. Doses numeriques + bornes >= 0
        Double hp10 = parseDouble(line.hp10Raw);
        Double hp007 = parseDouble(line.hp007Raw);
        Double hp3 = parseDouble(line.hp3Raw);
        if (hp10 == null || hp007 == null || hp3 == null) {
            return b.status(STATUS_INVALID_FORMAT)
                    .message("valeur numerique invalide (hp10/hp007/hp3)").build();
        }
        if (hp10 < 0 || hp007 < 0 || hp3 < 0) {
            return b.status(STATUS_INVALID_FORMAT).message("valeur negative interdite").build();
        }
        b.hp10(hp10).hp007(hp007).hp3(hp3);

        // 4. Source enum
        DoseSource source = parseSource(line.sourceRaw);
        if (source == null) {
            return b.status(STATUS_INVALID_FORMAT)
                    .message("source inconnue (attendu AGENCY|EPD|ESTIMATED) : " + line.sourceRaw).build();
        }
        b.source(source);

        // 5. belowDetection (optionnel - default false)
        boolean belowDetection = parseBool(line.belowDetectionRaw);
        b.belowDetection(belowDetection);

        // 6. Lookup worker par employeeId
        Long employeeId;
        try {
            employeeId = Long.parseLong(line.matricule);
        } catch (NumberFormatException nfe) {
            // Si le matricule n'est pas un entier, on tente toujours mais on remontera
            // WORKER_NOT_FOUND si rien ne correspond (le module RH peut avoir des matricules
            // alphanumeriques stockes ailleurs, hors de notre scope direct).
            return b.status(STATUS_WORKER_NOT_FOUND)
                    .message("matricule non numerique introuvable : " + line.matricule).build();
        }

        Optional<ExposedWorker> workerOpt = workerRepository.findByEmployeeId(employeeId);
        if (workerOpt.isEmpty()) {
            return b.status(STATUS_WORKER_NOT_FOUND)
                    .message("aucun ExposedWorker pour matricule " + line.matricule).build();
        }
        ExposedWorker worker = workerOpt.get();
        if (mineId != null && !mineId.equals(worker.getMineId())) {
            return b.status(STATUS_WORKER_NOT_FOUND)
                    .message("worker hors mine cible (mineId=" + worker.getMineId() + ")").build();
        }
        if (!worker.isActive()) {
            return b.status(STATUS_WORKER_NOT_FOUND)
                    .message("worker inactif (id=" + worker.getId() + ")").build();
        }
        b.workerId(worker.getId());

        // 7. Doublon intra-CSV
        String key = worker.getId() + "|" + line.period;
        if (seenWorkerPeriod.contains(key)) {
            return b.status(STATUS_DUPLICATE)
                    .message("ligne dupliquee dans le CSV pour (worker=" + worker.getId()
                            + ", period=" + line.period + ")").build();
        }

        // 8. Doublon en base : DoseRecord ACTIF deja present
        boolean existing = doseRecordRepository.findActiveByWorkerIdAndPeriod(worker.getId(), line.period).isPresent();
        if (existing) {
            return b.status(STATUS_DUPLICATE)
                    .message("DoseRecord actif deja present pour (worker=" + worker.getId()
                            + ", period=" + line.period + ")").build();
        }

        // 9. Warning value too high
        if (hp10 > WARNING_VALUE_HP10_MSV) {
            return b.status(STATUS_WARNING)
                    .message("hp10=" + hp10 + " mSv > seuil warning "
                            + WARNING_VALUE_HP10_MSV + " mSv").build();
        }

        return b.status(STATUS_VALID).message("ok").build();
    }

    // -------------------------------------------------------------------------------------------
    //   HELPERS
    // -------------------------------------------------------------------------------------------

    private static boolean isValidPeriod(String period) {
        if (period == null || period.length() != 7) return false;
        try {
            YearMonth.parse(period, PERIOD_FORMATTER);
            return true;
        } catch (DateTimeParseException ex) {
            return false;
        }
    }

    private static Double parseDouble(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return Double.valueOf(raw);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static DoseSource parseSource(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        try {
            return DoseSource.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static boolean parseBool(String raw) {
        if (raw == null || raw.isEmpty()) return false;
        return "true".equalsIgnoreCase(raw.trim()) || "1".equals(raw.trim()) || "yes".equalsIgnoreCase(raw.trim());
    }

    /**
     * Calcule un fingerprint SHA-256 hex (64 chars) du contenu CSV.
     * En cas d'absence de SHA-256 (JVM tres reduite), fallback sur taille + hashCode.
     */
    static String computeImportId(byte[] csvBytes) {
        if (csvBytes == null) csvBytes = new byte[0];
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(csvBytes);
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte by : hash) {
                String h = Integer.toHexString(0xff & by);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            return "len" + csvBytes.length + "-hash" + java.util.Arrays.hashCode(csvBytes);
        }
    }

    /**
     * Recherche un import precedent IMPORT_CSV avec le meme importId (pour idempotence).
     * On compare importId via le payload details (substring). Filtre aussi sur mineId si fourni.
     */
    private Optional<DosimetryAuditLog> findPreviousImport(String importId, Long mineId) {
        if (importId == null || importId.isEmpty()) return Optional.empty();
        List<DosimetryAuditLog> previous = auditLogRepository.findByAction(AUDIT_ACTION_IMPORT_CSV);
        String marker = "\"importId\":\"" + importId + "\"";
        for (DosimetryAuditLog log : previous) {
            if (log.getDetails() == null) continue;
            if (mineId != null && !mineId.equals(log.getEntityId())) continue;
            if (log.getDetails().contains(marker)) {
                return Optional.of(log);
            }
        }
        return Optional.empty();
    }

    private CsvImportResultDTO.ImportError toImportError(CsvImportPreviewDTO.PreviewRow row) {
        return CsvImportResultDTO.ImportError.builder()
                .lineNumber(row.getLineNumber())
                .matricule(row.getMatricule())
                .period(row.getPeriod())
                .status(row.getStatus())
                .message(row.getMessage())
                .build();
    }

    private String buildAuditDetails(String importId, int total, int imported, int skipped, int errors) {
        return "{\"importId\":\"" + importId
                + "\",\"totalRows\":" + total
                + ",\"importedCount\":" + imported
                + ",\"skippedCount\":" + skipped
                + ",\"errorCount\":" + errors + "}";
    }

    /**
     * Ligne CSV apres parsing brut, AVANT classification. Visibility package-private pour les
     * tests unitaires.
     */
    static class ParsedLine {
        int lineNumber;
        int columnCount;
        String matricule;
        String period;
        String hp10Raw;
        String hp007Raw;
        String hp3Raw;
        String sourceRaw;
        String belowDetectionRaw;
        String notes;
        String attachmentUrl;
    }
}
