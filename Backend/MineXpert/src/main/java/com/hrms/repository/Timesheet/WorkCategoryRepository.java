package com.hrms.repository.Timesheet;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Timesheet.WorkCategory;

public interface WorkCategoryRepository extends CrudRepository<WorkCategory, Long> {
    Optional<WorkCategory> findByCompany_Id(Long companyId);
}
