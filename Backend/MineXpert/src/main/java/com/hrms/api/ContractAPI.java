package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.ContractDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import jakarta.validation.Valid;
import com.hrms.service.ContractService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@CrossOrigin
@RequestMapping("/contract")
@Validated
public class ContractAPI {
    @Autowired
    private ContractService contractService;


    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addContract(@RequestBody @Valid ContractDTO contractDTO) throws HRMSException {
        contractService.addContract(contractDTO);
        return new ResponseEntity<>(new ResponseDTO("Contract added Successfully."), HttpStatus.CREATED);
    }
    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateContract(@RequestBody @Valid ContractDTO contractDTO) throws HRMSException {
        contractService.updateContract(contractDTO);
        return new ResponseEntity<>(new ResponseDTO("Contract updated Successfully."), HttpStatus.OK);
    }
    @PostMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteContract(@PathVariable Long id) throws HRMSException {
        contractService.deleteContract(id);
        return new ResponseEntity<>(new ResponseDTO("Contract deleted Successfully."), HttpStatus.OK);
    }
    @GetMapping("/get/{id}")
    public ResponseEntity<ContractDTO> getContract(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(contractService.getContract(id), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<ContractDTO>> getAllContracts() {
        return new ResponseEntity<>(contractService.getAllContracts(), HttpStatus.OK);
    }
    @GetMapping("/getSeparationData")
    public ResponseEntity<List<Object[]>> getSeparationData() {
        return new ResponseEntity<>(contractService.getSeparationData(), HttpStatus.OK);
    }
}
