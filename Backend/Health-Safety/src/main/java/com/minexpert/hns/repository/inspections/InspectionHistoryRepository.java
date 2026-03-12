package com.minexpert.hns.repository.inspections;

import java.util.List;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.inspections.InspectionHistory;

public interface InspectionHistoryRepository extends CrudRepository<InspectionHistory, Long> {
    List<InspectionHistory> findByInspectionId(Long inspectionId);
}
