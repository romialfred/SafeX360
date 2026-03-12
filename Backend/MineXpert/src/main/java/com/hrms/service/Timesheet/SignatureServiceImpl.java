package com.hrms.service.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.Timesheet.SignatureDTO;
import com.hrms.entity.Timesheet.Signature;
import com.hrms.enums.SignType;
import com.hrms.enums.TimesheetStatus;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.SignatureRepository;

@Service
public class SignatureServiceImpl implements SignatureService {

    @Autowired
    private SignatureRepository signatureRepository;
    @Autowired
    private TimesheetService timesheetService;

    @Override
    public void addSignature(SignatureDTO signatureDTO) throws HRMSException {
        Optional<Signature> optional = signatureRepository.findByTimesheet_IdAndSignType(signatureDTO.getTimesheetId(),
                signatureDTO.getSignType());
        if (optional.isPresent()) {
            throw new HRMSException("SIGNATURE_ALREADY_EXISTS");
        }
        SignType type = signatureDTO.getSignType();
        timesheetService.updateTimesheetStatus(signatureDTO.getTimesheetId(),
                type.equals(SignType.PREPARER) ? TimesheetStatus.PREPARED
                        : type.equals(SignType.VALIDATOR) ? TimesheetStatus.VALIDATED : TimesheetStatus.APPROVED);
        signatureRepository.save(signatureDTO.toEntity());
    }

    @Override
    public void updateSignature(SignatureDTO signatureDTO) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateSignature'");
    }

    @Override
    public void deleteSignature(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteSignature'");
    }

    @Override
    public SignatureDTO getSignature(Long id) throws HRMSException {
        return signatureRepository.findById(id).map(Signature::toDTO)
                .orElseThrow(() -> new HRMSException("SIGNATURE_NOT_FOUND"));
    }

    @Override
    public List<SignatureDTO> getSignaturesByTimesheet(Long timesheetId) {
        return signatureRepository.findByTimesheet_Id(timesheetId).stream().map(Signature::toDTO).toList();
    }

}
