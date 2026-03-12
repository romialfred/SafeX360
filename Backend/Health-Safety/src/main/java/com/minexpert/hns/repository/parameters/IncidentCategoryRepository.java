package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.IncidentCategoryResponse;
import com.minexpert.hns.entity.parameters.IncidentCategory;

public interface IncidentCategoryRepository extends CrudRepository<IncidentCategory, Long> {

    Optional<IncidentCategory> findByNameIgnoreCase(String name);

    @Query("SELECT i.id AS id, i.name AS name FROM IncidentCategory i where i.status = Status.ACTIVE")
    List<IncidentCategoryResponse> findAllActiveCategories();

}
