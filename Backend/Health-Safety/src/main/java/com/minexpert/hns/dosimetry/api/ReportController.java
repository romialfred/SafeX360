package com.minexpert.hns.dosimetry.api;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;
import com.minexpert.hns.dosimetry.service.DosimetryReportService;

import lombok.RequiredArgsConstructor;

/**
 * Controller REST des rapports PDF reglementaires (Phase 9).
 *
 * <p><b>RBAC matrix :</b>
 * <ul>
 *   <li>{@code /attestation/individual} : DOSIMETRY_WRITE (PCR) ou DOSIMETRY_MEDICAL +
 *       header {@code X-Reason} obligatoire.</li>
 *   <li>{@code /career-summary} : DOSIMETRY_MEDICAL (ou DOSIMETRY_READ_NOMINATIVE en
 *       self-service).</li>
 *   <li>{@code /annual-register} : DOSIMETRY_PCR_RPO ou DOSIMETRY_READ_AGGREGATE.</li>
 *   <li>{@code /overexposure/{caseId}} : DOSIMETRY_PCR_RPO + Reason.</li>
 * </ul>
 *
 * <p>Toutes les reponses retournent {@code application/pdf} en flux binaire avec
 * {@code Content-Disposition: attachment; filename=...}.
 */
@RestController
@RequestMapping("/dosimetry/report")
@CrossOrigin
@RequiredArgsConstructor
public class ReportController {

    private final DosimetryReportService reportService;

    /**
     * GET /dosimetry/report/attestation/individual?workerId=X&year=Y
     *
     * <p>RBAC : DOSIMETRY_WRITE (PCR) ou DOSIMETRY_MEDICAL. Reason obligatoire (header
     * {@code X-Reason}) ; on retourne 400 si absent.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_WRITE + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "')")
    @GetMapping(value = "/attestation/individual", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> attestationIndividual(
            @RequestParam("workerId") Long workerId,
            @RequestParam("year") int year,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason) {
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        DosimetryReportDocumentDTO doc = reportService.generateIndividualDoseAttestation(
                workerId, year, userId, reason);
        return toResponse(doc);
    }

    /**
     * GET /dosimetry/report/career-summary?workerId=X
     *
     * <p>RBAC : DOSIMETRY_MEDICAL ou SELF (DOSIMETRY_READ_NOMINATIVE filtre cote service).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_MEDICAL + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_NOMINATIVE + "')")
    @GetMapping(value = "/career-summary", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> careerSummary(
            @RequestParam("workerId") Long workerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason) {
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        DosimetryReportDocumentDTO doc = reportService.generateCareerSummary(
                workerId, userId, reason);
        return toResponse(doc);
    }

    /**
     * GET /dosimetry/report/annual-register?mineId=X&year=Y
     *
     * <p>RBAC : DOSIMETRY_PCR_RPO ou DOSIMETRY_READ_AGGREGATE. Pas de Reason : registre tres
     * institutionnel (publication recurrente), mais l'audit trace tout de meme l'export.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "') "
            + "or hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_READ_AGGREGATE + "')")
    @GetMapping(value = "/annual-register", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> annualRegister(
            @RequestParam("mineId") Long mineId,
            @RequestParam("year") int year,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        DosimetryReportDocumentDTO doc = reportService.generateAnnualMineRegister(
                mineId, year, userId);
        return toResponse(doc);
    }

    /**
     * GET /dosimetry/report/overexposure/{caseId}
     *
     * <p>RBAC : DOSIMETRY_PCR_RPO + Reason obligatoire (dossier sensible avec contexte
     * medical).
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @GetMapping(value = "/overexposure/{caseId}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> overexposure(
            @PathVariable("caseId") Long caseId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-Reason", required = false) String reason) {
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        DosimetryReportDocumentDTO doc = reportService.generateOverexposureReport(
                caseId, userId, reason);
        return toResponse(doc);
    }

    // ----------------------------------------------------------------------------

    private ResponseEntity<byte[]> toResponse(DosimetryReportDocumentDTO doc) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + doc.getFilename() + "\"");
        headers.add(HttpHeaders.CONTENT_TYPE, doc.getContentType());
        return new ResponseEntity<>(doc.getContent(), headers, HttpStatus.OK);
    }
}
