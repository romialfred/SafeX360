package com.hrms.repository.Timesheet;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Timesheet.WorkHourCode;

public interface WorkHourCodeRepository extends CrudRepository<WorkHourCode, String> {
    Optional<WorkHourCode> findByPayrollCode(String payrollCode);

    Optional<WorkHourCode> findByName(String name);

}
