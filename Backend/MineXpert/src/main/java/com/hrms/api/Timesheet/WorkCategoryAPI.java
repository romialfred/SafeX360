package com.hrms.api.Timesheet;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.WorkCategoryDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.WorkCategoryService;

@RestController
@RequestMapping("/workCategory")
@CrossOrigin
@Validated
public class WorkCategoryAPI {

    @Autowired
    private WorkCategoryService workCategoryService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createWorkHourCategory(@RequestBody WorkCategoryDTO workCategoryDTO)
            throws HRMSException {
        workCategoryService.saveWorkCategory(workCategoryDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Hour Category created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWorkHourCategory(@RequestBody WorkCategoryDTO workCategoryDTO)
            throws HRMSException {
        workCategoryService.updateWorkCategory(workCategoryDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Hour Category updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<WorkCategoryDTO> getWorkHourCategory(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(workCategoryService.getWorkCategoryById(id), HttpStatus.OK);
    }

    @GetMapping("/getByCompany/{companyId}")
    public ResponseEntity<WorkCategoryDTO> getWorkHourCategoryByCompany(@PathVariable Long companyId)
            throws HRMSException {
        return new ResponseEntity<>(workCategoryService.getWorkCategoryByCompanyId(companyId), HttpStatus.OK);
    }

}
