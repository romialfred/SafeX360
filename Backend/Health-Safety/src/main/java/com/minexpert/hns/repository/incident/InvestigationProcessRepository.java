package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.incident.InvestigationProcess;

public interface InvestigationProcessRepository extends CrudRepository<InvestigationProcess, Long> {
    List<InvestigationProcess> findByInvestigation_Id(Long investigationId);

}
