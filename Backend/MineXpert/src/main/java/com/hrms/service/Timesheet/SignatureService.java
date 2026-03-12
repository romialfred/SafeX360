package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.dto.Timesheet.SignatureDTO;
import com.hrms.exception.HRMSException;

public interface SignatureService {
    public void addSignature(SignatureDTO signatureDTO) throws HRMSException;

    public void updateSignature(SignatureDTO signatureDTO) throws HRMSException;

    public void deleteSignature(Long id);

    public SignatureDTO getSignature(Long id) throws HRMSException;

    public List<SignatureDTO> getSignaturesByTimesheet(Long timesheetId);

}
