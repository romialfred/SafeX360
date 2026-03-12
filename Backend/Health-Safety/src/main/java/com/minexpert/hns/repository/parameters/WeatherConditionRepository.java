package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.WeatherConditionResponse;
import com.minexpert.hns.entity.parameters.WeatherCondition;

public interface WeatherConditionRepository extends CrudRepository<WeatherCondition, Long> {
    Optional<WeatherCondition> findByNameIgnoreCase(String name);

    @Query("SELECT w.id AS id, w.name AS name, w.description AS description, w.status AS status FROM WeatherCondition w")
    List<WeatherConditionResponse> findAllWithName();

    @Query("SELECT w.id AS id, w.name AS name FROM WeatherCondition w where w.status = Status.ACTIVE")
    List<WeatherConditionResponse> findAllActiveWeather();

    @Query("SELECT w.id AS id, w.name AS name FROM WeatherCondition w where w.id in ?1")
    List<WeatherConditionResponse> findByIds(List<Long> ids);
}
