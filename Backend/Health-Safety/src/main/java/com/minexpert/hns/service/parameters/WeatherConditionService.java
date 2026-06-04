package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.WeatherConditionDTO;
import com.minexpert.hns.dto.response.WeatherConditionResponse;
import com.minexpert.hns.exception.HSException;

public interface WeatherConditionService {
    Long addWeatherCondition(Long companyId, WeatherConditionDTO weatherConditionDTO) throws HSException;

    void updateWeatherCondition(Long companyId, WeatherConditionDTO weatherConditionDTO) throws HSException;

    void deleteWeatherCondition(Long companyId, Long id) throws HSException;

    WeatherConditionDTO getWeatherConditionById(Long companyId, Long id) throws HSException;

    void activateWeatherCondition(Long companyId, Long id) throws HSException;

    List<WeatherConditionResponse> getAllWeatherConditions(Long companyId) throws HSException;

    List<WeatherConditionResponse> getAllActiveWeatherConditions(Long companyId) throws HSException;

    void deactivateWeatherCondition(Long companyId, Long id) throws HSException;

    List<WeatherConditionResponse> getWeatherConditionsByIds(Long companyId, List<Long> ids);
}
