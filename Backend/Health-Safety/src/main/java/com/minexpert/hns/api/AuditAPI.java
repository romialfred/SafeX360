package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.audit.AreaDTO;
import com.minexpert.hns.dto.audit.AreaDetails;
import com.minexpert.hns.dto.audit.AuditDTO;
import com.minexpert.hns.dto.audit.AuditDetails;
import com.minexpert.hns.dto.audit.AuditRequest;
import com.minexpert.hns.dto.audit.AuditorDTO;
import com.minexpert.hns.dto.audit.ExecuteRequest;
import com.minexpert.hns.dto.audit.FollowupDTO;
import com.minexpert.hns.dto.audit.RecommendationDTO;
import com.minexpert.hns.dto.audit.RecommendationDetails;
import com.minexpert.hns.entity.audit.FollowupResponse;
import com.minexpert.hns.service.audit.AreaService;
import com.minexpert.hns.service.audit.AuditService;
import com.minexpert.hns.service.audit.AuditorService;
import com.minexpert.hns.service.audit.RecommendationFollowupService;
import com.minexpert.hns.service.audit.RecommendationService;
import com.minexpert.hns.service.audit.ReportService;
import com.minexpert.hns.enums.RecommendationStatus;
import com.minexpert.hns.exception.HSException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/audit")
@CrossOrigin
@Validated
@RequiredArgsConstructor

public class AuditAPI {
    private final AuditService auditService;
    private final AreaService areaService;
    private final ReportService reportService;
    private final RecommendationService recommendationService;
    private final RecommendationFollowupService recommendationFollowupService;
    private final AuditorService auditorService;
    private final com.minexpert.hns.service.audit.AuditOwnershipGuard auditOwnershipGuard;

    @PostMapping("/create")
    public ResponseEntity<Long> createAudit(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody AuditRequest request) throws HSException {
        // Cloisonnement par mine : le companyId de la mine active (injecté en query par
        // l'intercepteur Axios) est persisté sur l'audit, sinon l'audit devient INVISIBLE
        // dans les listes filtrées par mine. Les auditeurs en héritent (voir service).
        //
        // On EXIGE la mine (doctrine COMPANY_ID_REQUIRED) : sans elle, l'audit — et les
        // auditeurs qui en héritent — naîtrait orphelin (companyId=null), invisible dès
        // qu'une mine est sélectionnée. L'HSException est convertie en 400 clair par
        // ExceptionControllerAdvice, exactement comme les autres endpoints signalent
        // leurs refus métier.
        if (companyId == null || companyId <= 0) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (request.getAudit() != null) {
            request.getAudit().setCompanyId(companyId);
        }
        return new ResponseEntity<>(auditService.createAudit(request), HttpStatus.CREATED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AuditDTO>> getAllAudits(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(auditService.getAllAudits(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAreas/{auditId}")
    public ResponseEntity<List<AreaDTO>> getAreasByAuditId(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse les données d'un audit d'une autre mine.
        auditOwnershipGuard.assertAuditCompany(auditId, companyId);
        return new ResponseEntity<>(areaService.getAreasByAuditId(auditId), HttpStatus.OK);
    }

    @PostMapping("/execute")
    public ResponseEntity<ResponseDTO> executeAudit(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody ExecuteRequest request) throws HSException {
        // Cloisonnement par mine : refuse d'exécuter/rapporter un audit d'une autre mine.
        if (request.getReport() != null) {
            auditOwnershipGuard.assertAuditCompany(request.getReport().getAuditId(), companyId);
        }
        // Cloisonnement par mine : les contributeurs héritent du companyId de la mine active.
        if (companyId != null && request.getContributors() != null) {
            request.getContributors().forEach(c -> c.setCompanyId(companyId));
        }
        // Cloisonnement par mine : même traitement que POST /createRecommendation —
        // refus de rattacher une recommandation à un audit d'une autre mine, puis
        // héritage du companyId de la mine active. L'auditId manquant est résolu
        // depuis le rapport (le formulaire ne demande jamais la mine).
        if (request.getRecommendations() != null) {
            Long reportAuditId = request.getReport() != null ? request.getReport().getAuditId() : null;
            for (RecommendationDTO recommendation : request.getRecommendations()) {
                if (recommendation.getAuditId() == null) {
                    recommendation.setAuditId(reportAuditId);
                }
                auditOwnershipGuard.assertAuditCompany(recommendation.getAuditId(), companyId);
                if (companyId != null) {
                    recommendation.setCompanyId(companyId);
                }
            }
        }
        auditService.executeAudit(request);
        return new ResponseEntity<>(new ResponseDTO("Audit executed successfully"), HttpStatus.OK);
    }

    @GetMapping("/reportExists/{auditId}")
    public ResponseEntity<Boolean> reportExists(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId) throws HSException {
        auditOwnershipGuard.assertAuditCompany(auditId, companyId);
        return new ResponseEntity<>(reportService.reportExists(auditId), HttpStatus.OK);
    }

    @GetMapping("/getAllRecommendations")
    public ResponseEntity<List<RecommendationDetails>> getAllRecommendations(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(recommendationService.getAllRecommendationDetails(companyId), HttpStatus.OK);
    }

    @GetMapping("/getPendingRecommendations")
    public ResponseEntity<List<RecommendationDetails>> getPendingRecommendations(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(
                recommendationService.getRecommendationDetailsByStatus(RecommendationStatus.PENDING, companyId),
                HttpStatus.OK);
    }

    @GetMapping("/getInProgressRecommendations")
    public ResponseEntity<List<RecommendationDetails>> getInProgressRecommendations(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(
                recommendationService.getRecommendationDetailsByStatus(RecommendationStatus.IN_PROGRESS, companyId),
                HttpStatus.OK);
    }

    @PostMapping("/createRecommendation")
    public ResponseEntity<Long> createRecommendation(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody RecommendationDTO recommendationDTO)
            throws HSException {
        // Cloisonnement par mine : refuse de rattacher une recommandation à un audit
        // d'une autre mine, puis hérite du companyId de la mine active.
        auditOwnershipGuard.assertAuditCompany(recommendationDTO.getAuditId(), companyId);
        if (companyId != null) {
            recommendationDTO.setCompanyId(companyId);
        }
        Long recommendationId = recommendationService.createRecommendation(recommendationDTO);
        return new ResponseEntity<>(recommendationId, HttpStatus.CREATED);
    }

    @GetMapping("/getRecommendationsByAuditId/{auditId}")
    public ResponseEntity<List<RecommendationDTO>> getRecommendationsByAuditId(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId)
            throws HSException {
        auditOwnershipGuard.assertAuditCompany(auditId, companyId);
        return new ResponseEntity<>(recommendationService.getRecommendationsByAuditId(auditId), HttpStatus.OK);
    }

    @PostMapping("/createFollowup")
    public ResponseEntity<ResponseDTO> createFollowup(@Valid @RequestBody FollowupDTO followupDTO,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse un suivi sur une recommandation d'une autre mine.
        auditOwnershipGuard.assertRecommendationCompany(followupDTO.getRecommendationId(), companyId);
        recommendationFollowupService.addRecommendationFollowup(followupDTO);
        return new ResponseEntity<>(new ResponseDTO("Followup created successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/getFollowup/{recommendationId}")
    public ResponseEntity<List<FollowupResponse>> getFollowup(@PathVariable Long recommendationId) throws HSException {
        return new ResponseEntity<>(
                recommendationFollowupService.getAllRecommendationFollowupsByRecommendationId(recommendationId),
                HttpStatus.OK);
    }

    @GetMapping("/getRecommendation/{id}")
    public ResponseEntity<RecommendationDTO> getRecommendation(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : la recommandation doit appartenir à la mine active.
        auditOwnershipGuard.assertRecommendationCompany(id, companyId);
        return new ResponseEntity<>(recommendationService.getRecommendation(id), HttpStatus.OK);
    }

    @GetMapping("/getDetails/{id}")
    public ResponseEntity<AuditDetails> getAuditDetails(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : l'audit (id) doit appartenir à la mine active.
        auditOwnershipGuard.assertAuditCompany(id, companyId);
        return new ResponseEntity<>(auditService.getAuditDetails(id), HttpStatus.OK);
    }

    @GetMapping("/getAuditors/{auditId}")
    public ResponseEntity<List<AuditorDTO>> getAuditorsByAuditId(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId) throws HSException {
        auditOwnershipGuard.assertAuditCompany(auditId, companyId);
        return new ResponseEntity<>(auditorService.getAuditorsByAuditId(auditId), HttpStatus.OK);
    }

    @GetMapping("/getAreasDetails/{auditId}")
    public ResponseEntity<List<AreaDetails>> getAreaDetailsByAuditId(@PathVariable Long auditId,
            @RequestParam(required = false) Long companyId) throws HSException {
        auditOwnershipGuard.assertAuditCompany(auditId, companyId);
        return new ResponseEntity<>(areaService.getAreaDetailsByAuditId(auditId), HttpStatus.OK);
    }

    @GetMapping("/getPlanningAudits")
    public ResponseEntity<List<AuditDTO>> getAllPlanningAudits(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(auditService.getAllPlanningAudits(companyId), HttpStatus.OK);
    }

    @PutMapping("/approvePlanning/{id}")
    public ResponseEntity<ResponseDTO> approvePlanning(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse d'approuver le planning d'un audit d'une autre mine.
        auditOwnershipGuard.assertAuditCompany(id, companyId);
        auditService.approvePlanning(id);
        return new ResponseEntity<>(new ResponseDTO("Planning Approved"), HttpStatus.OK);
    }

    @PutMapping("/rejectPlanning/{id}")
    public ResponseEntity<ResponseDTO> rejectPlanning(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse de rejeter le planning d'un audit d'une autre mine.
        auditOwnershipGuard.assertAuditCompany(id, companyId);
        auditService.rejectPlanning(id);
        return new ResponseEntity<>(new ResponseDTO("Planning Rejected"), HttpStatus.OK);
    }

    @DeleteMapping("/deleteAuditor/{id}")
    public ResponseEntity<ResponseDTO> deleteAuditor(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse de supprimer un auditeur d'une autre mine.
        auditOwnershipGuard.assertAuditorCompany(id, companyId);
        auditorService.deleteAuditor(id);
        return new ResponseEntity<>(new ResponseDTO("Auditor deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getLeadAuditorsForPlanning")
    public ResponseEntity<List<AuditorDTO>> getLeadAuditorsForPlanning(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(auditorService.getLeadAuditorsForPlanning(companyId), HttpStatus.OK);
    }

    @GetMapping("/getLeadAuditors")
    public ResponseEntity<List<AuditorDTO>> getLeadAuditors(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(auditorService.getLeadAuditors(companyId), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateAudit(@Valid @RequestBody AuditRequest request,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement par mine : refuse de modifier un audit d'une autre mine.
        if (request.getAudit() != null) {
            auditOwnershipGuard.assertAuditCompany(request.getAudit().getId(), companyId);
        }
        auditService.updateAudit(request);
        return new ResponseEntity<>(new ResponseDTO("Audit updated successfully"), HttpStatus.OK);
    }

}
