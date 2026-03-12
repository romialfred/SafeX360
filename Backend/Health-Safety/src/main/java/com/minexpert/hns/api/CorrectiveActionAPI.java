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
    public ResponseEntity<Long> createCorrectiveAction(@RequestBody CorrectiveActionDTO correctiveActionDTO)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.addCorrectiveAction(correctiveActionDTO), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteCorrectiveActionById(@PathVariable Long id) throws HSException {
        correctiveActionService.deleteCorrectiveAction(id);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllActions() throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllActions(), HttpStatus.OK);
    }

    @GetMapping("/getAllAdhoc")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllAdhocActions() throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllAdhocActions(), HttpStatus.OK);
    }

    @GetMapping("/getAllPendingAdhoc")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllPendingAdhocActions() throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllPendingAdhocActions(), HttpStatus.OK);
    }

    @GetMapping("/getAllPending")
    public ResponseEntity<List<CorrectiveActionResponse>> getAllPendingActions() throws HSException {
        return new ResponseEntity<>(correctiveActionService.getAllPendingActions(), HttpStatus.OK);
    }

    @GetMapping("/getByIncidentId/{incidentId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByIncidentId(@PathVariable Long incidentId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByIncidentId(incidentId), HttpStatus.OK);
    }

    @GetMapping("/getByInspectionId/{inspectionId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByInspectionId(@PathVariable Long inspectionId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByInspectionId(inspectionId), HttpStatus.OK);
    }

    @GetMapping("/getByActivityId/{activityId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByActivityId(@PathVariable Long activityId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByActivityId(activityId), HttpStatus.OK);
    }

    @GetMapping("/getByDepartmentId/{departmentId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByDepartmentId(@PathVariable Long departmentId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByDepartmentId(departmentId), HttpStatus.OK);
    }

    @GetMapping("/getByNonConformityId/{nonConformityId}")
    public ResponseEntity<List<CorrectiveActionResponse>> getActionsByNonConformityId(
            @PathVariable Long nonConformityId)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getActionsByNonConformityId(nonConformityId),
                HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CorrectiveActionResponse> getCorrectiveActionById(@PathVariable Long id)
            throws HSException {
        return new ResponseEntity<>(correctiveActionService.getCorrectiveActionById(id), HttpStatus.OK);
    }

    @GetMapping("/getDescription/{id}")
    public ResponseEntity<String> getCorrectiveActionDescription(@PathVariable Long id) throws HSException {
        CorrectiveActionResponse action = correctiveActionService.getCorrectiveActionById(id);
        return new ResponseEntity<>(action.getDescription(), HttpStatus.OK);
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<ResponseDTO> approveAction(@PathVariable Long id) throws HSException {
        correctiveActionService.approveAction(id);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action approved"), HttpStatus.OK);
    }

    @PutMapping("/cancel/{id}")
    public ResponseEntity<ResponseDTO> cancelAction(@PathVariable Long id) throws HSException {
        correctiveActionService.cancelAction(id);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action cancelled"), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateCorrectiveAction(
            @RequestBody CorrectiveActionDTO correctiveActionDTO) throws HSException {
        correctiveActionService.updateCorrectiveAction(correctiveActionDTO);
        return new ResponseEntity<>(new ResponseDTO("Corrective Action updated successfully"), HttpStatus.OK);
    }

}
