package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.Contributor;

public interface ContributorRepository extends CrudRepository<Contributor, Long> {
    List<Contributor> findByAudit_Id(Long auditId);
}
