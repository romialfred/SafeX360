package com.minexpert.hns.repository.incident;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.incident.ActionProcess;

public interface ActionProcessRepository extends CrudRepository<ActionProcess, Long> {

    @Query("SELECT ap FROM ActionProcess ap WHERE ap.correctiveAction.id = ?1")
    List<ActionProcess> findByActionId(Long actionId);
}
