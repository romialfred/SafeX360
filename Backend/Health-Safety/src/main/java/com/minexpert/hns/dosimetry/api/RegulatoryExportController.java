package com.minexpert.hns.dosimetry.api;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dosimetry.config.DosimetryRBACConfig;
import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;
import com.minexpert.hns.dosimetry.service.RegulatoryExportService;

import lombok.RequiredArgsConstructor;

/**
 * Controller REST des exports reglementaires (Phase 9).
 *
 * <p><b>RBAC :</b> tous les endpoints requierent {@link DosimetryRBACConfig#DOSIMETRY_PCR_RPO}.
 * L'audit est trace cote service.
 */
@RestController
@RequestMapping("/dosimetry/regulatory-export")
@CrossOrigin
@RequiredArgsConstructor
public class RegulatoryExportController {

    private final RegulatoryExportService exportService;

    /**
     * GET /dosimetry/regulatory-export/annual-xml?mineId=X&year=Y
     * Export XML annuel "fiche ASN" pour une mine.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @GetMapping("/annual-xml")
    public ResponseEntity<byte[]> annualXml(
            @RequestParam("mineId") Long mineId,
            @RequestParam("year") int year,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        DosimetryReportDocumentDTO doc = exportService.exportAnnualXmlForAsn(mineId, year, userId);
        return toResponse(doc);
    }

    /**
     * GET /dosimetry/regulatory-export/annual-csv?mineId=X&year=Y&format=ASN_V1
     * Export CSV (BOM UTF-8) pour upload regulateur ou Excel.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @GetMapping("/annual-csv")
    public ResponseEntity<byte[]> annualCsv(
            @RequestParam("mineId") Long mineId,
            @RequestParam("year") int year,
            @RequestParam(value = "format", required = false) String format,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        DosimetryReportDocumentDTO doc = exportService.exportAnnualCsvForRegulator(
                mineId, year, userId, format);
        return toResponse(doc);
    }

    /**
     * GET /dosimetry/regulatory-export/incidents-xml?mineId=X&year=Y
     * Export XML de l'ensemble des cas de surexposition declares.
     */
    @PreAuthorize("hasAuthority('" + DosimetryRBACConfig.DOSIMETRY_PCR_RPO + "')")
    @GetMapping("/incidents-xml")
    public ResponseEntity<byte[]> incidentsXml(
            @RequestParam("mineId") Long mineId,
            @RequestParam("year") int year,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        DosimetryReportDocumentDTO doc = exportService.exportIncidentsXmlForAsn(mineId, year, userId);
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
