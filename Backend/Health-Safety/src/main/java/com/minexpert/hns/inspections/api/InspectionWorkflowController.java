package com.minexpert.hns.inspections.api;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.inspections.config.InspectionRBACConfig;
import com.minexpert.hns.inspections.dto.ApprovalDTO;
import com.minexpert.hns.inspections.dto.FindingDTO;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;
import com.minexpert.hns.inspections.dto.InspectionSummaryDTO;
import com.minexpert.hns.inspections.dto.InspectionTeamMemberDTO;
import com.minexpert.hns.inspections.dto.ScheduleInspectionDTO;
import com.minexpert.hns.inspections.service.InspectionReportPdfService;
import com.minexpert.hns.inspections.service.InspectionWorkflowService;

import jakarta.validation.Valid;

/**
 * Controller REST du workflow d'inspection refondu.
 *
 * <p>La Gateway strip le prefix {@code /hns/}, le mapping reel cote HS est
 * donc {@code /inspection}.</p>
 */
@RestController
@CrossOrigin
@RequestMapping("/inspection")
public class InspectionWorkflowController {

    @Autowired
    private InspectionWorkflowService workflowService;

    @Autowired
    private InspectionReportPdfService pdfService;

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/list")
    public ResponseEntity<List<InspectionSummaryDTO>> list(
            @RequestParam(value = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(workflowService.listAll(companyId));
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/{id}")
    public ResponseEntity<InspectionDetailDTO> getDetail(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(workflowService.getDetail(id, companyId));
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_PLAN + "')")
    @PostMapping("/schedule")
    public ResponseEntity<Long> schedule(@Valid @RequestBody ScheduleInspectionDTO dto,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        Long id = workflowService.schedule(dto, userId, companyId);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    /**
     * Remplace l'equipe d'une inspection deja planifiee (employe + role).
     *
     * <p>Meme permission que la planification : composer l'equipe EST un acte de
     * planification, pas d'execution. Semantique de REMPLACEMENT integral : la
     * liste recue devient l'equipe (une fusion interdirait de retirer un
     * membre). Liste vide => equipe videe et primaryInspectorId remis a null.
     * Refuse apres APPROVED/ARCHIVED (rapport fige).</p>
     */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_PLAN + "')")
    @PutMapping("/{id}/team")
    public ResponseEntity<ResponseDTO> updateTeam(@PathVariable Long id,
            @RequestBody(required = false) List<InspectionTeamMemberDTO> members,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.updateTeam(id, members, userId, companyId);
        return ResponseEntity.ok(new ResponseDTO("Equipe d'inspection mise a jour"));
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PostMapping("/{id}/start")
    public ResponseEntity<ResponseDTO> start(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.start(id, userId, companyId);
        return ResponseEntity.ok(new ResponseDTO("Inspection demarree"));
    }

    /**
     * Saisie batch des findings (mobile/tablette). Liste idempotente :
     * upsert par id existant ou par checkpointId pour la creation.
     */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PostMapping("/{id}/findings/batch")
    public ResponseEntity<ResponseDTO> saveFindings(@PathVariable Long id,
            @RequestBody List<FindingDTO> findings,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.saveFindings(id, findings, userId, companyId);
        return ResponseEntity.ok(new ResponseDTO(findings.size() + " constat(s) enregistre(s)"));
    }

    /** Met a jour le texte de synthese (rapport modifiable). */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PutMapping("/{id}/summary")
    public ResponseEntity<ResponseDTO> updateSummary(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.updateSummary(id, body.getOrDefault("summary", ""), userId, companyId);
        return ResponseEntity.ok(new ResponseDTO("Synthese mise a jour"));
    }

    /** Soumet l'inspection pour validation equipe. */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<ResponseDTO> submit(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.submit(id, userId, companyId);
        return ResponseEntity.ok(new ResponseDTO("Inspection soumise pour validation"));
    }

    /**
     * Decision d'approbation. Param query {@code expectedApprovers} est le
     * nombre total d'approbations attendues (cardinalite de l'equipe).
     * Si non fourni, par defaut 1 (mono-approver).
     */
    /**
     * Telecharge le rapport PDF d'une inspection. Disponible pour tout statut
     * (en cours, soumis, archive). Le PDF est rendu en francais par defaut
     * sauf si {@code ?lang=en} est specifie.
     *
     * <p>Reference ISO 45001 §9.1 : surveillance, mesure, analyse et evaluation
     * de la performance HSE. Le document est conserve a titre de preuve.</p>
     */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/{id}/report/pdf")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id,
            @RequestParam(value = "lang", required = false, defaultValue = "fr") String lang,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        boolean english = "en".equalsIgnoreCase(lang);
        // Cloisonnement : refuser le PDF d'une inspection d'une autre mine.
        workflowService.assertAccessible(id, companyId);
        byte[] pdf = pdfService.generate(id, english);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "inspection-" + id + (english ? "-en" : "-fr") + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VALIDATE + "')")
    @PostMapping("/{id}/decide")
    public ResponseEntity<ResponseDTO> decide(@PathVariable Long id,
            @Valid @RequestBody ApprovalDTO dto,
            @RequestParam(value = "expectedApprovers", required = false, defaultValue = "1")
            int expectedApprovers,
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.decide(id, dto, userId, expectedApprovers, companyId);
        return ResponseEntity.ok(new ResponseDTO("Decision enregistree"));
    }
}
