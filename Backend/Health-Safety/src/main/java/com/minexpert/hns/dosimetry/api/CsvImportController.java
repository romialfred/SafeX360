package com.minexpert.hns.dosimetry.api;

import java.io.IOException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.minexpert.hns.dosimetry.dto.CsvImportPreviewDTO;
import com.minexpert.hns.dosimetry.dto.CsvImportResultDTO;
import com.minexpert.hns.dosimetry.dto.DosimetryAuditLogDTO;
import com.minexpert.hns.dosimetry.entity.DosimetryAuditLog;
import com.minexpert.hns.dosimetry.service.CsvImportService;

import lombok.RequiredArgsConstructor;

/**
 * Controller d'import CSV des resultats dosimetriques (agences agreees).
 *
 * <p>Endpoints :
 * <ul>
 *   <li>POST /dosimetry/import/preview - analyse + classification, AUCUNE persistance.</li>
 *   <li>POST /dosimetry/import/execute - re-parse + persiste les lignes VALID/WARNING.</li>
 *   <li>GET  /dosimetry/import/history?mineId={X} - liste des imports passes (audit logs).</li>
 * </ul>
 *
 * <p>RBAC : preview + execute exigent {@code DOSIMETRY_WRITE} ; history exige
 * {@code DOSIMETRY_READ_NOMINATIVE} car il revele les imports passes (nombre de records,
 * timestamps).
 *
 * <p>Format multipart : champ {@code file} contient le fichier CSV (Content-Type text/csv
 * ou application/octet-stream tolere). Les autres parametres ({@code mineId},
 * {@code skipDuplicates}, {@code actorId}) sont passes en query string.
 */
@RestController
@RequestMapping("/dosimetry/import")
@CrossOrigin
@RequiredArgsConstructor
public class CsvImportController {

    private static final Logger LOGGER = LoggerFactory.getLogger(CsvImportController.class);

    private final CsvImportService importService;

    /**
     * Analyse le CSV sans persister. Renvoie le preview classification valid/warning/error
     * + un importId fingerprint pour detection de doublon cote frontend.
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PostMapping("/preview")
    public ResponseEntity<CsvImportPreviewDTO> preview(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mineId") Long mineId) {
        byte[] bytes = readBytes(file);
        return new ResponseEntity<>(importService.preview(bytes, mineId), HttpStatus.OK);
    }

    /**
     * Execute l'import : re-parse, valide et persiste les DoseRecord. Transactionnel : tout
     * ou rien (rollback en cas d'erreur runtime). Idempotent : meme contenu binaire deja
     * importe -> renvoie idempotentReplay=true sans creer de nouveau record.
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_WRITE')")
    @PostMapping("/execute")
    public ResponseEntity<CsvImportResultDTO> execute(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mineId") Long mineId,
            @RequestParam(name = "skipDuplicates", required = false, defaultValue = "false")
                    boolean skipDuplicates,
            @RequestParam(name = "actorId", required = false) Long actorId) {
        byte[] bytes = readBytes(file);
        return new ResponseEntity<>(
                importService.execute(bytes, mineId, actorId, skipDuplicates),
                HttpStatus.OK);
    }

    /**
     * Historique des imports CSV pour une mine donnee. Renvoie la liste des
     * {@link DosimetryAuditLog} action=IMPORT_CSV, plus recents en tete.
     */
    @PreAuthorize("hasAuthority('DOSIMETRY_READ_NOMINATIVE')")
    @GetMapping("/history")
    public ResponseEntity<List<DosimetryAuditLogDTO>> history(
            @RequestParam(name = "mineId", required = false) Long mineId) {
        List<DosimetryAuditLog> entries = importService.history(mineId);
        List<DosimetryAuditLogDTO> dtos = entries.stream().map(CsvImportController::toDto).toList();
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    // -------------------------------------------------------------------------------------------
    //   HELPERS
    // -------------------------------------------------------------------------------------------

    private byte[] readBytes(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return new byte[0];
        }
        try {
            return file.getBytes();
        } catch (IOException ex) {
            LOGGER.error("[CsvImportController] multipart read FAILED : {}", ex.getMessage(), ex);
            return new byte[0];
        }
    }

    private static DosimetryAuditLogDTO toDto(DosimetryAuditLog e) {
        DosimetryAuditLogDTO dto = new DosimetryAuditLogDTO();
        dto.setId(e.getId());
        dto.setAction(e.getAction());
        dto.setEntityType(e.getEntityType());
        dto.setEntityId(e.getEntityId());
        dto.setUserId(e.getUserId());
        dto.setUserPermissions(e.getUserPermissions());
        dto.setTimestamp(e.getTimestamp());
        dto.setIpAddress(e.getIpAddress());
        dto.setDetails(e.getDetails());
        return dto;
    }
}
