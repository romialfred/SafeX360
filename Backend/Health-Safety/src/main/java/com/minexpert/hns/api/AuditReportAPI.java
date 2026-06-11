package com.minexpert.hns.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.dto.audit.ReportDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AuditReportPdfService;
import com.minexpert.hns.service.audit.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/audit-report")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class AuditReportAPI {
    private final ReportService reportService;
    private final AuditReportPdfService auditReportPdfService;

    /**
     * LOT 52 — rapport d'audit PDF structuré ISO 19011 §6.5 (identification,
     * critères, équipe, réunions, synthèse checklist, constats classés,
     * conclusions et approbation).
     */
    @GetMapping("/pdf/{auditId}")
    public ResponseEntity<byte[]> getReportPdf(@PathVariable Long auditId) throws HSException {
        byte[] pdf = auditReportPdfService.generatePdf(auditId);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=rapport-audit-" + auditId + ".pdf")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdf);
    }

    @PostMapping("/create")
    public ResponseEntity<Long> createReport(@RequestBody ExecuteRequest request) throws HSException {
        return new ResponseEntity<>(reportService.createReport(request), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateReport(@RequestBody ExecuteRequest request) throws HSException {
        reportService.updateReport(request);
        return new ResponseEntity<>(new ResponseDTO("Report updated successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ReportDTO> getReport(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(reportService.getReport(id), HttpStatus.OK);
    }

    @GetMapping("/getByAuditId/{auditId}")
    public ResponseEntity<ExecuteRequest> getReportByAuditId(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(reportService.getReportByAuditId(auditId), HttpStatus.OK);
    }

    @GetMapping("/exists/{auditId}")
    public ResponseEntity<Boolean> reportExists(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(reportService.reportExists(auditId), HttpStatus.OK);
    }

}
