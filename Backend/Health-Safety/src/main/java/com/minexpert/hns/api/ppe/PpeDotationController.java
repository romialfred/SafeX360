package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.dotation.DotationDetailDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationEmployeeDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationListDTO;
import com.minexpert.hns.dto.ppe.dotation.DotationSummaryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeDotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

/**
 * Suivi des dotations EPI (conformité par employé). Conformité calculée côté serveur
 * (source unique). Cloisonné par mine (companyId injecté par la passerelle).
 */
@RestController
@CrossOrigin
@RequestMapping("/ppe-dotation")
@RequiredArgsConstructor
public class PpeDotationController {
    private final PpeDotationService dotationService;

    @GetMapping("/summary")
    public ResponseEntity<DotationSummaryDTO> summary(@RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(dotationService.getSummary(companyId));
    }

    @GetMapping("/employees")
    public ResponseEntity<DotationListDTO> employees(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String function,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "10") int size) throws HSException {
        return ResponseEntity.ok(dotationService.getEmployees(companyId, search, status, department, function, sort, page, size));
    }

    @GetMapping("/employees/{empId}")
    public ResponseEntity<DotationDetailDTO> detail(@PathVariable Long empId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(dotationService.getEmployeeDetail(companyId, empId));
    }

    /** Export CSV des résultats filtrés (respecte filtres + cloisonnement mine). */
    @GetMapping("/export")
    public ResponseEntity<ByteArrayResource> export(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String function,
            @RequestParam(required = false) String sort) throws HSException {
        DotationListDTO list = dotationService.getEmployees(companyId, search, status, department, function, sort, 0, 100000);
        StringBuilder sb = new StringBuilder("﻿"); // BOM UTF-8 (Excel accents)
        sb.append("Matricule;Employé;Département;Poste;Conformité (%);Exigences satisfaites;Exigences totales;Statut;Dernière dotation;Prochain renouvellement\n");
        for (DotationEmployeeDTO e : list.getContent()) {
            sb.append(csv(e.getMatricule())).append(';')
                    .append(csv(e.getName())).append(';')
                    .append(csv(e.getDepartment())).append(';')
                    .append(csv(e.getPosition())).append(';')
                    .append(e.getCompliancePct()).append(';')
                    .append(e.getSatisfiedCount()).append(';')
                    .append(e.getRequiredCount()).append(';')
                    .append(csv(e.getStatus())).append(';')
                    .append(e.getLastDotationDate() != null ? e.getLastDotationDate().toString() : "").append(';')
                    .append(e.getNextRenewalDate() != null ? e.getNextRenewalDate().toString() : "").append('\n');
        }
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"suivi-dotations-epi.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(new ByteArrayResource(bytes));
    }

    private static String csv(String v) {
        if (v == null) return "";
        String s = v.replace("\"", "\"\"");
        return (s.contains(";") || s.contains("\n") || s.contains("\"")) ? "\"" + s + "\"" : s;
    }
}
