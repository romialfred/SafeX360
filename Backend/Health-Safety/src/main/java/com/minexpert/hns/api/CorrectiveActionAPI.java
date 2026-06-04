package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.minexpert.hns.dto.CorrectiveActionDTO;
import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.response.CorrectiveActionResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.incident.CorrectiveActionService;

@RestController
@RequestMapping("/corrective-action")
@CrossOrigin
@Validated
public class CorrectiveActionAPI {

    @Autowired
    private CorrectiveActionService correctiveActionService;

    @PostMapping("/create")
    public ResponseEntity<Long> createCorrectiveAction(@RequestParam("companyId") Long companyId,
            @RequestBody CorrectiveActionDTO correctiveActionDTO)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.addCorrectiveAction(companyId, correctiveActionDTO),
                HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteCorrectiveActionById(@RequestParam("companyId") Long companyId,
            @PathVariable Long id) throws HSException {
        correctiveActionService.deleteCorrectiveAction(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllActions(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllActions(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllAdhoc")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllAdhocActions(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllAdhocActions(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllPendingAdhoc")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllPendingAdhocActions(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllPendingAdhocActions(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllPending")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllPendingActions(
            @RequestParam(name = "companyId", required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllPendingActions(companyId), HttpStatus.OK);
    }

    @GetMapping("/getByIncidentId/{incidentId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByIncidentId(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long incidentId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByIncidentId(companyId, incidentId),
                HttpStatus.OK);
    }

    @GetMapping("/getByInspectionId/{inspectionId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByInspectionId(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long inspectionId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByInspectionId(companyId, inspectionId),
                HttpStatus.OK);
    }

    @GetMapping("/getByActivityId/{activityId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByActivityId(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long activityId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByActivityId(companyId, activityId),
                HttpStatus.OK);
    }

    @GetMapping("/getByDepartmentId/{departmentId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByDepartmentId(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long departmentId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByDepartmentId(companyId, departmentId),
                HttpStatus.OK);
    }

    @GetMapping("/getByNonConformityId/{nonConformityId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByNonConformityId(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long nonConformityId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByNonConformityId(companyId, nonConformityId),
                HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CorrectiveActionResponse> getCorrectiveActionById(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getCorrectiveActionById(companyId, id), HttpStatus.OK);
    }

    @GetMapping("/getDescription/{id}")
    public ResponseEntity<String> getCorrectiveActionDescription(
            @RequestParam(name = "companyId", required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        CorrectiveActionResponse action = correctiveActionService.getCorrectiveActionById(companyId, id);
        return new ResponseEntity<>(action.getDescription(), HttpStatus.OK);
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<ResponseDTO> approveAction(@RequestParam("companyId") Long companyId, @PathVariable Long id)
            throws HSException {
        correctiveActionService.approveAction(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action approved"), HttpStatus.OK);
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<ResponseDTO> cancelAction(@RequestParam("companyId") Long companyId, @PathVariable Long id)
            throws HSException {
        correctiveActionService.cancelAction(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action cancelled"), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateCorrectiveAction(
            @RequestParam("companyId") Long companyId,
            @RequestBody CorrectiveActionDTO correctiveActionDTO) throws HSException {
        correctiveActionService.updateCorrectiveAction(companyId, correctiveActionDTO);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action updated successfully"), HttpStatus.OK);
    }

}
