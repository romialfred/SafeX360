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

import com.hrms.dto.CompanyDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.CompanyService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/company")
@Validated
public class CompanyAPI {
    @Autowired
    private CompanyService companyService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addCompany(@RequestBody @Valid CompanyDTO companyDTO) throws HRMSException {
        companyService.addCompany(companyDTO);
        return new ResponseEntity<>(new ResponseDTO("Company added Successfully."), HttpStatus.CREATED);
    }
    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateCompany(@RequestBody @Valid CompanyDTO companyDTO) throws HRMSException {
        companyService.updateCompany(companyDTO);
        return new ResponseEntity<>(new ResponseDTO("Company updated Successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CompanyDTO> getCompany(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(companyService.getCompany(id), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<CompanyDTO>> getAllCompanies() throws HRMSException {
        return new ResponseEntity<>(companyService.getAllCompanies(), HttpStatus.OK);
    }
    @GetMapping("/getAllActive")
    public ResponseEntity<List<CompanyDTO>> getAllActiveCompanies() throws HRMSException {
        return new ResponseEntity<>(companyService.getAllActiveCompanies(), HttpStatus.OK);
    }
}
