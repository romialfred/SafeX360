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
import org.springframework.web.bind.annotation.RestController;

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
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.audit.AreaService;
import com.minexpert.hns.service.audit.AuditService;
import com.minexpert.hns.service.audit.AuditorService;
import com.minexpert.hns.service.audit.RecommendationFollowupService;
import com.minexpert.hns.service.audit.RecommendationService;
import com.minexpert.hns.service.audit.ReportService;
import com.minexpert.hns.enums.RecommendationStatus;

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

    @PostMapping("/create")
    public ResponseEntity<Long> createAudit(@RequestBody AuditRequest request) throws HSException {
        return new ResponseEntity<>(auditService.createAudit(request), HttpStatus.CREATED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AuditDTO>> getAllAudits() throws HSException {
        return new ResponseEntity<>(auditService.getAllAudits(), HttpStatus.OK);
    }

    @GetMapping("/getAreas/{auditId}")
    public ResponseEntity<List<AreaDTO>> getAreasByAuditId(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(areaService.getAreasByAuditId(auditId), HttpStatus.OK);
    }

    @PostMapping("/execute")
    public ResponseEntity<ResponseDTO> executeAudit(@RequestBody ExecuteRequest request) throws HSException {
        auditService.executeAudit(request);
        return new ResponseEntity<>(new ResponseDTO("Audit executed successfully"), HttpStatus.OK);
    }

    @GetMapping("/reportExists/{auditId}")
    public ResponseEntity<Boolean> reportExists(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(reportService.reportExists(auditId), HttpStatus.OK);
    }

    @GetMapping("/getAllRecommendations")
    public ResponseEntity<List<RecommendationDetails>> getRecommendation() throws HSException {
        return new ResponseEntity<>(recommendationService.getAllRecommendationDetails(), HttpStatus.OK);
    }

    @GetMapping("/getPendingRecommendations")
    public ResponseEntity<List<RecommendationDetails>> getPendingRecommendations() throws HSException {
        return new ResponseEntity<>(
                recommendationService.getRecommendationDetailsByStatus(RecommendationStatus.PENDING), HttpStatus.OK);
    }

    @GetMapping("/getInProgressRecommendations")
    public ResponseEntity<List<RecommendationDetails>> getInProgressRecommendations() throws HSException {
        return new ResponseEntity<>(
                recommendationService.getRecommendationDetailsByStatus(RecommendationStatus.IN_PROGRESS),
                HttpStatus.OK);
    }

    @PostMapping("/createRecommendation")
    public ResponseEntity<Long> createRecommendation(@RequestBody RecommendationDTO recommendationDTO)
            throws HSException {
        Long recommendationId = recommendationService.createRecommendation(recommendationDTO);
        return new ResponseEntity<>(recommendationId, HttpStatus.CREATED);
    }

    @GetMapping("/getRecommendationsByAuditId/{auditId}")
    public ResponseEntity<List<RecommendationDTO>> getRecommendationsByAuditId(@PathVariable Long auditId)
            throws HSException {
        return new ResponseEntity<>(recommendationService.getRecommendationsByAuditId(auditId), HttpStatus.OK);
    }

    @PostMapping("/createFollowup")
    public ResponseEntity<ResponseDTO> createFollowup(@RequestBody FollowupDTO followupDTO) throws HSException {
        System.out.println("FollowupDTO: " + followupDTO);
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
    public ResponseEntity<RecommendationDTO> getRecommendation(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(recommendationService.getRecommendation(id), HttpStatus.OK);
    }

    @GetMapping("/getDetails/{id}")
    public ResponseEntity<AuditDetails> getAuditDetails(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(auditService.getAuditDetails(id), HttpStatus.OK);
    }

    @GetMapping("/getAuditors/{auditId}")
    public ResponseEntity<List<AuditorDTO>> getAuditorsByAuditId(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(auditorService.getAuditorsByAuditId(auditId), HttpStatus.OK);
    }

    @GetMapping("/getAreasDetails/{auditId}")
    public ResponseEntity<List<AreaDetails>> getAreaDetailsByAuditId(@PathVariable Long auditId) throws HSException {
        return new ResponseEntity<>(areaService.getAreaDetailsByAuditId(auditId), HttpStatus.OK);
    }

    @GetMapping("/getPlanningAudits")
    public ResponseEntity<List<AuditDTO>> getAllPlanningAudits() throws HSException {
        return new ResponseEntity<>(auditService.getAllPlanningAudits(), HttpStatus.OK);
    }

    @PutMapping("/approvePlanning/{id}")
    public ResponseEntity<ResponseDTO> approvePlanning(@PathVariable Long id) throws HSException {
        auditService.approvePlanning(id);
        return new ResponseEntity<>(new ResponseDTO("Planning Approved"), HttpStatus.OK);
    }

    @PutMapping("/rejectPlanning/{id}")
    public ResponseEntity<ResponseDTO> rejectPlanning(@PathVariable Long id) throws HSException {
        auditService.rejectPlanning(id);
        return new ResponseEntity<>(new ResponseDTO("Planning Rejected"), HttpStatus.OK);
    }

    @DeleteMapping("/deleteAuditor/{id}")
    public ResponseEntity<ResponseDTO> deleteAuditor(@PathVariable Long id) throws HSException {
        auditorService.deleteAuditor(id);
        return new ResponseEntity<>(new ResponseDTO("Auditor deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getLeadAuditorsForPlanning")
    public ResponseEntity<List<AuditorDTO>> getLeadAuditorsForPlanning()
            throws HSException {
        return new ResponseEntity<>(auditorService.getLeadAuditorsForPlanning(), HttpStatus.OK);
    }

    @GetMapping("/getLeadAuditors")
    public ResponseEntity<List<AuditorDTO>> getLeadAuditors() throws HSException {
        return new ResponseEntity<>(auditorService.getLeadAuditors(), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateAudit(@RequestBody AuditRequest request) throws HSException {
        auditService.updateAudit(request);
        return new ResponseEntity<>(new ResponseDTO("Audit updated successfully"), HttpStatus.OK);
    }

}
