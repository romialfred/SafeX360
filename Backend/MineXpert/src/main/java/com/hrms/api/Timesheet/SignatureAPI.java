package com.hrms.api.Timesheet;

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

import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.MultipleSignatureDTO;
import com.hrms.dto.Timesheet.SignatureDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.SignatureService;

@RestController
@RequestMapping("/signature")
@CrossOrigin
@Validated
public class SignatureAPI {

    @Autowired
    private SignatureService signatureService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addSignature(@RequestBody SignatureDTO signatureDTO) throws HRMSException {
        signatureService.addSignature(signatureDTO);
        return new ResponseEntity<>(new ResponseDTO("Signature added successfully"), HttpStatus.CREATED);
    }

    @PostMapping("/addMultiple")
    public ResponseEntity<ResponseDTO> addMultipleSignature(@RequestBody MultipleSignatureDTO multipleSignatureDTO)
            throws HRMSException {
        List<Long> timesheets = multipleSignatureDTO.getTimesheets();
        timesheets.parallelStream().forEach((timesheetId) -> {
            SignatureDTO signatureDTO = new SignatureDTO(null, timesheetId, multipleSignatureDTO.getSignedBy(),
                    multipleSignatureDTO.getSignature(), multipleSignatureDTO.getSignType());
            try {
                signatureService.addSignature(signatureDTO);
            } catch (HRMSException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }

        });

        return new ResponseEntity<>(new ResponseDTO("Signatures added successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<SignatureDTO> getSignature(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(signatureService.getSignature(id), HttpStatus.OK);
    }

    @GetMapping("/getByTimesheet/{timesheetId}")
    public ResponseEntity<List<SignatureDTO>> getSignaturesByTimesheet(@PathVariable Long timesheetId) {
        return new ResponseEntity<>(signatureService.getSignaturesByTimesheet(timesheetId), HttpStatus.OK);
    }

}
