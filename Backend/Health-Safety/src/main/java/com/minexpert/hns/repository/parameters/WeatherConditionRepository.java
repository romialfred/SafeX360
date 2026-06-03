package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.WeatherConditionResponse;
import com.minexpert.hns.entity.parameters.WeatherCondition;
import com.minexpert.hns.enums.Status;

public interface WeatherConditionRepository extends CrudRepository<WeatherCondition, Long> {
    Optional<WeatherCondition> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    @Query("SELECT w.id AS id, w.name AS name, w.description AS description, w.companyId AS companyId, w.status AS status FROM WeatherCondition w WHERE (:companyId IS NULL OR w.companyId = :companyId)")
    List<WeatherConditionResponse> findAllWithName(@Param("companyId") Long companyId);

    @Query("SELECT w.id AS id, w.name AS name, w.companyId AS companyId, w.status AS status FROM WeatherCondition w WHERE w.status = :status AND (:companyId IS NULL OR w.companyId = :companyId)")
    List<WeatherConditionResponse> findAllByStatus(@Param("companyId") Long companyId, @Param("status") Status status);

    @Query("SELECT w.id AS id, w.name AS name, w.description AS description, w.companyId AS companyId, w.status AS status FROM WeatherCondition w WHERE w.id in :ids AND (:companyId IS NULL OR w.companyId = :companyId)")
    List<WeatherConditionResponse> findByIds(@Param("companyId") Long companyId, @Param("ids") List<Long> ids);

    @Query("SELECT w FROM WeatherCondition w WHERE w.id = :id AND (:companyId IS NULL OR w.companyId = :companyId)")
    Optional<WeatherCondition> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);
}
