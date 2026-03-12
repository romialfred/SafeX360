package com.minexpert.hns.repository.inspections;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.inspections.InspectionChecklist;

public interface InspectionChecklistRepository extends CrudRepository<InspectionChecklist, Long> {

    List<InspectionChecklist> findByGeneralInspection_Id(Long id);
}
