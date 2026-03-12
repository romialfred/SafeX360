package com.minexpert.hns.repository.audit;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.AreaExecution;

public interface AreaExecutionRepository extends CrudRepository<AreaExecution, Long> {
    List<AreaExecution> findByArea_Id(Long areaId);
}
