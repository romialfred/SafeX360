package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.dto.ReimbursementStatus;
import com.hrms.entity.SalaryAdvance;

public interface SalaryAdvanceRepository extends CrudRepository<SalaryAdvance, Long> {
    List<SalaryAdvance> findByEmpId(Long employeeId);

    List<SalaryAdvance> findByApproverId(Long approverId);

    Optional<SalaryAdvance> findByEmpIdAndReimbursementIn(Long empId, List<ReimbursementStatus> reimbursement);
}
