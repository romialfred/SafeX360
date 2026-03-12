package com.hrms.api.Timesheet;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.WorkHourCodeDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.WorkHourCodeService;

@RestController
@RequestMapping("/workHourCodes")
@CrossOrigin
@Validated
public class WorkHourCodeAPI {

    @Autowired
    private WorkHourCodeService workHourCodeService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createWorkHourCode(@RequestBody WorkHourCodeDTO workHourCodeDTO)
            throws HRMSException {
        workHourCodeService.createWorkHourCode(workHourCodeDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Hour Code created successfully"), HttpStatus.CREATED);
    }

    @PostMapping("/createAll")
    public ResponseEntity<ResponseDTO> createWorkHourCode(@RequestBody List<WorkHourCodeDTO> workHourCodeDTOs)
            throws HRMSException {
        workHourCodeDTOs.parallelStream().forEach((x) -> {
            try {
                workHourCodeService.createWorkHourCode(x);
            } catch (HRMSException e) {
                e.printStackTrace();
            }

        });
        return new ResponseEntity<>(new ResponseDTO("Work Hour Code created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateWorkHourCode(@RequestBody WorkHourCodeDTO workHourCodeDTO)
            throws HRMSException {
        workHourCodeService.updateWorkHourCode(workHourCodeDTO);
        return new ResponseEntity<>(new ResponseDTO("Work Hour Code updated successfully"), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{code}")
    public ResponseEntity<ResponseDTO> deleteWorkHourCode(@PathVariable String code) throws HRMSException {
        workHourCodeService.deleteWorkHourCode(code);
        return new ResponseEntity<>(new ResponseDTO("Work Hour Code deleted successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<WorkHourCodeDTO>> getAllWorkHourCodes() {
        return new ResponseEntity<>(workHourCodeService.getAllWorkHourCodes(), HttpStatus.OK);
    }

}
