package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.hrms.DataInterface.PositionResponse;
import com.hrms.entity.Position;

public interface PositionRepository extends CrudRepository<Position, Long> {
    Optional<Position> findByNameIgnoreCaseAndCompany_IdAndPositionCategory_Id(String name, Long companyId,
            Long categoryId);

    @Query("SELECT p.id AS id, p.name AS name FROM Position p WHERE p.status = Status.ACTIVE")
    List<PositionResponse> findAllPositionNames();

    @Query("SELECT p.id AS id, p.name AS name FROM Position p WHERE p.id = :id")
    Optional<PositionResponse> findPositionById(Long id);

}
