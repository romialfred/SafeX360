package com.hrms.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.LeaveSetting;

public interface LeaveSettingRepository extends CrudRepository<LeaveSetting, Long> {
    List<LeaveSetting>findAllByStatus(String status);
    List<LeaveSetting>findAllByNameIgnoreCaseAndCompany_Id(String name, Long companyId);
}
