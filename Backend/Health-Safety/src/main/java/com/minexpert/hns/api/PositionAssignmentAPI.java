package com.minexpert.hns.api;

import java.util.List;

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
import com.minexpert.hns.dto.compliance.AssignReqResponse;
import com.minexpert.hns.dto.compliance.AssignmentRequest;
import com.minexpert.hns.dto.compliance.AssignmentResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.compliance.PositionAssignmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/position-assignment")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class PositionAssignmentAPI {

    private final PositionAssignmentService positionAssignmentService;

    @PostMapping("/create")
    public ResponseEntity<Long> createPositionAssignment(@RequestBody AssignmentRequest request) throws HSException {
        return new ResponseEntity<>(positionAssignmentService.createPositionAssignment(request), HttpStatus.CREATED);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AssignmentResponse>> getAllPositionAssignments() throws HSException {
        return new ResponseEntity<>(positionAssignmentService.getAllPositionAssignments(), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activatePositionAssignment(@PathVariable Long id) throws HSException {
        positionAssignmentService.activatePositionAssignment(id);
        return new ResponseEntity<>(new ResponseDTO("Position Assignment Activated Successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivatePositionAssignment(@PathVariable Long id) throws HSException {
        positionAssignmentService.deactivatePositionAssignment(id);
        return new ResponseEntity<>(new ResponseDTO("Position Assignment Deactivated Successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{positionId}")
    public ResponseEntity<AssignReqResponse> getPositionAssignmentByPositionId(@PathVariable Long positionId)
            throws HSException {
        return new ResponseEntity<>(positionAssignmentService.getPositionAssignmentByPositionId(positionId),
                HttpStatus.OK);
    }
}
