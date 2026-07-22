package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.dto.RegulatoryStatusDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.DepartmentIncidentStats;
import com.minexpert.hns.dto.response.IncidentResponse;
import com.minexpert.hns.dto.response.YearlyClosureData;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.IncidentReportPdfService;
import com.minexpert.hns.service.incident.IncidentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/incidents")
@CrossOrigin
@Validated
public class IncidentAPI {

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private IncidentReportPdfService incidentReportPdfService;

    // @Valid est indispensable ICI : le @Validated de classe ne couvre que les
    // parametres de methode (@RequestParam/@PathVariable), jamais le corps de la
    // requete. Sans lui, les contraintes de IncidentDTO n'etaient JAMAIS evaluees —
    // un titre vide ou de plus de 255 caracteres partait jusqu'a la base.
    // Volontairement PAS de @Valid sur /update : ce endpoint recoit des incidents
    // existants, et un rejet 400 y ferait perdre la saisie en cours. A traiter
    // separement.
    @PostMapping("/report")
    public ResponseEntity<ResponseDTO> reportIncident(@RequestParam("companyId") Long companyId,
            @Valid @RequestBody IncidentDTO incidentDTO) throws HSException {
        incidentService.reportIncident(companyId, incidentDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident reported successfully."), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncident(@RequestParam("companyId") Long companyId,
            @RequestBody IncidentDTO incidentDTO) throws HSException {
        incidentService.updateIncident(companyId, incidentDTO);
        return new ResponseEntity<>(new ResponseDTO("Incident updated successfully."), HttpStatus.OK);
    }

    // ── Reporting réglementaire (ISO 45001 §7.5.3 · E3.1) ──
    // RACI : consigner/effacer une obligation réglementaire ou une déclaration à
    // l'autorité est un acte « Accountable » (coordinateur/manager HSE + admins) —
    // même autorité que la clôture. L'auditeur/l'employé (bloqués en WRITE par la
    // matrice) ET l'investigateur (qui passe WRITE) sont ainsi tous exclus.
    /** Marque l'incident notifiable + échéance statutaire (companyId optionnel = vue consolidée). */
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAuthority('" + com.minexpert.hns.config.IncidentRbacConfig.INCIDENT_CLOSE + "')")
    @PutMapping("/{id}/regulatory")
    public ResponseEntity<ResponseDTO> setRegulatoryStatus(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long id,
            @RequestBody RegulatoryStatusDTO body) throws HSException {
        incidentService.setRegulatoryStatus(companyId, id,
                body != null ? body.getNotifiable() : null,
                body != null ? body.getRegulatoryDeadline() : null);
        return new ResponseEntity<>(new ResponseDTO("Regulatory status updated."), HttpStatus.OK);
    }

    /** Enregistre la déclaration effective à l'autorité (arrête la minuterie). */
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAuthority('" + com.minexpert.hns.config.IncidentRbacConfig.INCIDENT_CLOSE + "')")
    @PutMapping("/{id}/mark-notified")
    public ResponseEntity<ResponseDTO> markNotified(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        incidentService.markNotifiedToAuthority(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident marked as notified to authority."), HttpStatus.OK);
    }

    /** Export PDF officiel de l'incident + son enquête (téléchargement). */
    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        byte[] pdf = incidentReportPdfService.generatePdf(companyId, id);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE,
                        org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"incident-" + id + ".pdf\"")
                .body(pdf);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents(
            @RequestParam(name = "companyId", required = false) Long companyId)
            throws HSException {
        System.out.println("Received request to get all incidents for companyId: " + companyId);
        return new ResponseEntity<>(incidentService.getAllIncidents(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentDTO> getIncidentById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id)
            throws HSException {
        return new ResponseEntity<>(incidentService.getIncidentById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getDetails/{id}")
    public ResponseEntity<IncidentResponse> getIncidentResponseById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentService.getIncidentResponseById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/yearly-closure/{year}")
    public ResponseEntity<List<YearlyClosureData>> getYearlyClosureData(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable int year) {
        return new ResponseEntity<>(incidentService.getYearlyClosureData(companyId, year), HttpStatus.OK);
    }

    /**
     * Returns 30-day incident metrics for the requested department, including
     * recent incident reports, completed investigations, and corrective actions
     * that remain pending or in progress within the same window.
     *
     * @param departmentId department identifier to filter the metrics
     * @return aggregated counts for the last 30 days
     */
    @GetMapping("/department/stats/{departmentId}")
    public ResponseEntity<DepartmentIncidentStats> getDepartmentIncidentStats(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long departmentId) {
        return ResponseEntity.ok(incidentService.getDepartmentIncidentStats(companyId, departmentId));
    }

}
