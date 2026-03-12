package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.PositionResponse;
import com.hrms.dto.PositionDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.PositionService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/position")
@Validated
public class PositionAPI {

    @Autowired
    private PositionService positionService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addPosition(@RequestBody @Valid PositionDTO positionDTO) throws HRMSException {
        positionService.addPosition(positionDTO);
        return new ResponseEntity<>(new ResponseDTO("Position added Successfully."), HttpStatus.CREATED);
    }

    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updatePosition(@RequestBody @Valid PositionDTO positionDTO)
            throws HRMSException {
        positionService.updatePosition(positionDTO);
        return new ResponseEntity<>(new ResponseDTO("Position updated Successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PositionDTO> getPosition(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(positionService.getPosition(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PositionDTO>> getAllPositions() throws HRMSException {
        return new ResponseEntity<>(positionService.getAllPositions(), HttpStatus.OK);
    }

    @GetMapping("/getAllPositionNames")
    public ResponseEntity<List<PositionResponse>> getAllPositionNames() throws HRMSException {
        return new ResponseEntity<>(positionService.getAllPositionNames(), HttpStatus.OK);
    }

    @GetMapping("/getNameById/{id}")
    public ResponseEntity<PositionResponse> getPositionById(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(positionService.getPositionById(id), HttpStatus.OK);
    }
}
