package com.hrms.service.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.Timesheet.WorkHourCodeDTO;
import com.hrms.entity.Timesheet.WorkHourCode;
import com.hrms.enums.CodeStatus;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.WorkHourCodeRepository;

@Service
public class WorkHourCodeServiceImpl implements WorkHourCodeService {

    @Autowired
    private WorkHourCodeRepository workHourCodeRepository;

    @Override
    public void createWorkHourCode(WorkHourCodeDTO workHourCodeDTO) throws HRMSException {
        Optional<WorkHourCode> optional = workHourCodeRepository.findById(workHourCodeDTO.getCode());
        if (optional.isPresent()) {
            throw new HRMSException("WORK_HOUR_CODE_ALREADY_EXISTS");
        }
        Optional<WorkHourCode> optional1 = workHourCodeRepository
                .findByName(workHourCodeDTO.getName());
        if (optional1.isPresent()) {
            throw new HRMSException("WORK_HOUR_CODE_NAME_ALREADY_EXISTS");
        }
        Optional<WorkHourCode> optional2 = workHourCodeRepository
                .findByPayrollCode(workHourCodeDTO.getPayrollCode());
        if (optional2.isPresent()) {
            throw new HRMSException("WORK_HOUR_CODE_PAYROLL_CODE_ALREADY_EXISTS");
        }
        workHourCodeDTO.setStatus(CodeStatus.ACTIVE);
        workHourCodeRepository.save(workHourCodeDTO.toEntity());
    }

    @Override
    public void updateWorkHourCode(WorkHourCodeDTO workHourCodeDTO) throws HRMSException {
        WorkHourCode whc = workHourCodeRepository.findById(workHourCodeDTO.getCode())
                .orElseThrow(() -> new HRMSException("WORK_HOUR_CODE_NOT_FOUND"));

        if (whc.getCode() != workHourCodeDTO.getCode()) {
            throw new HRMSException("CANNOT_UPDATE_WORK_HOUR_CODE");
        }
        if (!workHourCodeDTO.getName().equals(whc.getName())) {
            Optional<WorkHourCode> optional = workHourCodeRepository
                    .findByName(workHourCodeDTO.getName());
            if (optional.isPresent()) {
                throw new HRMSException("WORK_HOUR_CODE_NAME_ALREADY_EXISTS");
            }
        }
        if (!workHourCodeDTO.getPayrollCode().equals(whc.getPayrollCode())) {
            Optional<WorkHourCode> optional = workHourCodeRepository
                    .findByPayrollCode(workHourCodeDTO.getPayrollCode());
            if (optional.isPresent()) {
                throw new HRMSException("WORK_HOUR_CODE_PAYROLL_CODE_ALREADY_EXISTS");
            }
        }
        workHourCodeRepository.save(workHourCodeDTO.toEntity());
    }

    @Override
    public void deleteWorkHourCode(String code) throws HRMSException {
        WorkHourCode whc = workHourCodeRepository.findById(code)
                .orElseThrow(() -> new HRMSException("WORK_HOUR_CODE_NOT_FOUND"));
        workHourCodeRepository.delete(whc);
    }

    @Override
    public List<WorkHourCodeDTO> getAllWorkHourCodes() {
        return ((List<WorkHourCode>) workHourCodeRepository.findAll()).stream().map(WorkHourCode::toDTO).toList();
    }

}
