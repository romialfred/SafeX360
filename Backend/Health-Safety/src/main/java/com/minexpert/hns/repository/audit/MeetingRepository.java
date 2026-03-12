package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.Meeting;

public interface MeetingRepository extends CrudRepository<Meeting, Long> {
    List<Meeting> findByAudit_Id(Long auditId);
}
