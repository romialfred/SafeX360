package com.hrms.service;

import java.util.List;

import com.hrms.dto.SalaryAdvanceDTO;
import com.hrms.exception.HRMSException;

public interface SalaryAdvanceService {
    void addSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws HRMSException;

    void updateSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws HRMSException;

    SalaryAdvanceDTO getSalaryAdvance(Long id) throws HRMSException;

    List<SalaryAdvanceDTO> getAllSalaryAdvancesByApproverId(Long approverId);

    List<SalaryAdvanceDTO> getSalaryAdvanceByEmpId(Long empId);

    void approveSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception;

    void rejectSalaryAdvance(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception;

    void firstPayment(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception;

    void secondPayment(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception;

    void thirdPayment(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception;

    void completeReimbursement(SalaryAdvanceDTO salaryAdvanceDTO) throws Exception;
}
