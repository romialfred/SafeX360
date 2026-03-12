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

import com.hrms.dto.ServiceDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.ServiceService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/service")
@Validated
public class ServiceAPI {
    
    @Autowired
    private ServiceService serviceService;

      @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addService(@RequestBody @Valid ServiceDTO serviceDTO) throws HRMSException {
        serviceService.addService(serviceDTO);
        return new ResponseEntity<>(new ResponseDTO("Service added Successfully."), HttpStatus.CREATED);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ServiceDTO> getService(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(serviceService.getService(id), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<ServiceDTO>> getAllServices() throws HRMSException {
        return new ResponseEntity<>(serviceService.getAllServices(), HttpStatus.OK);
    }
}
