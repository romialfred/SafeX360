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
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.inspections.config.InspectionRBACConfig;
import com.minexpert.hns.inspections.dto.ApprovalDTO;
import com.minexpert.hns.inspections.dto.FindingDTO;
import com.minexpert.hns.inspections.dto.InspectionDetailDTO;
import com.minexpert.hns.inspections.dto.InspectionSummaryDTO;
import com.minexpert.hns.inspections.dto.ScheduleInspectionDTO;
import com.minexpert.hns.inspections.service.InspectionWorkflowService;

import jakarta.validation.Valid;

/**
 * Controller REST du workflow d'inspection refondu.
 *
 * <p>La Gateway strip le prefix {@code /hns/}, le mapping reel cote HS est
 * donc {@code /inspection}.</p>
 */
@RestController
@RequestMapping("/inspection")
public class InspectionWorkflowController {

    @Autowired
    private InspectionWorkflowService workflowService;

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/list")
    public ResponseEntity<List<InspectionSummaryDTO>> list() {
        return ResponseEntity.ok(workflowService.listAll());
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VIEW + "')")
    @GetMapping("/{id}")
    public ResponseEntity<InspectionDetailDTO> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(workflowService.getDetail(id));
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_PLAN + "')")
    @PostMapping("/schedule")
    public ResponseEntity<Long> schedule(@Valid @RequestBody ScheduleInspectionDTO dto,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        Long id = workflowService.schedule(dto, userId);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PostMapping("/{id}/start")
    public ResponseEntity<ResponseDTO> start(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.start(id, userId);
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
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.saveFindings(id, findings, userId);
        return ResponseEntity.ok(new ResponseDTO(findings.size() + " constat(s) enregistre(s)"));
    }

    /** Met a jour le texte de synthese (rapport modifiable). */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PutMapping("/{id}/summary")
    public ResponseEntity<ResponseDTO> updateSummary(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.updateSummary(id, body.getOrDefault("summary", ""), userId);
        return ResponseEntity.ok(new ResponseDTO("Synthese mise a jour"));
    }

    /** Soumet l'inspection pour validation equipe. */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_EXECUTE + "')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<ResponseDTO> submit(@PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.submit(id, userId);
        return ResponseEntity.ok(new ResponseDTO("Inspection soumise pour validation"));
    }

    /**
     * Decision d'approbation. Param query {@code expectedApprovers} est le
     * nombre total d'approbations attendues (cardinalite de l'equipe).
     * Si non fourni, par defaut 1 (mono-approver).
     */
    @PreAuthorize("hasAuthority('" + InspectionRBACConfig.INSPECTION_VALIDATE + "')")
    @PostMapping("/{id}/decide")
    public ResponseEntity<ResponseDTO> decide(@PathVariable Long id,
            @Valid @RequestBody ApprovalDTO dto,
            @RequestParam(value = "expectedApprovers", required = false, defaultValue = "1")
            int expectedApprovers,
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "0") Long userId) {
        workflowService.decide(id, dto, userId, expectedApprovers);
        return ResponseEntity.ok(new ResponseDTO("Decision enregistree"));
    }
}
