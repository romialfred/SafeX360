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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.DepartmentNames;
import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.dto.DepartmentDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.DepartmentService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/department")
@Validated
public class DepartmentAPI {

    @Autowired
    private DepartmentService departmentService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addDepartment(@RequestBody @Valid DepartmentDTO departmentDTO)
            throws HRMSException {
        departmentService.addDepartment(departmentDTO);
        return new ResponseEntity<>(new ResponseDTO("Department added Successfully."), HttpStatus.CREATED);
    }

    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateDepartment(@RequestBody @Valid DepartmentDTO departmentDTO)
            throws HRMSException {
        departmentService.updateDepartment(departmentDTO);
        return new ResponseEntity<>(new ResponseDTO("Department updated Successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DepartmentDTO> getDepartment(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(departmentService.getDepartment(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() throws HRMSException {
        return new ResponseEntity<>(departmentService.getAllDepartments(), HttpStatus.OK);
    }

    @GetMapping("/getByCompanyId/{companyId}")
    public ResponseEntity<List<DepartmentDTO>> getDepartmentsByCompanyId(@PathVariable Long companyId)
            throws HRMSException {
        return new ResponseEntity<>(departmentService.getDepartmentsByCompanyId(companyId), HttpStatus.OK);
    }

    @GetMapping("/getNames")
    public ResponseEntity<List<DepartmentNames>> getDepartmentNamesByCompanyId()
            throws HRMSException {
        return new ResponseEntity<>(departmentService.getAllDepartmentNames(), HttpStatus.OK);
    }

    @GetMapping("/getByIds")
    public ResponseEntity<List<DepartmentNames>> getEmployeesByIds(@RequestParam List<Long> ids) throws HRMSException {
        return new ResponseEntity<>(departmentService.getDepartmentsByIds(ids), HttpStatus.OK);
    }
}
