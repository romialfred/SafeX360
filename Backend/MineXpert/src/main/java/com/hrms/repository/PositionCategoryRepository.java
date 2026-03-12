package com.hrms.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.PositionCategory;

public interface PositionCategoryRepository extends CrudRepository<PositionCategory, Long> {
    Optional<PositionCategory>findByNameIgnoreCaseAndGradeIgnoreCase(String name, String grade);
}
