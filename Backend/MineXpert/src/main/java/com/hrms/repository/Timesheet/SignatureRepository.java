package com.hrms.repository.Timesheet;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Timesheet.Signature;
import com.hrms.enums.SignType;

public interface SignatureRepository extends CrudRepository<Signature, Long> {
    Optional<Signature> findByTimesheet_IdAndSignType(Long timesheetId, SignType signType);

    List<Signature> findByTimesheet_Id(Long timesheetId);
}
