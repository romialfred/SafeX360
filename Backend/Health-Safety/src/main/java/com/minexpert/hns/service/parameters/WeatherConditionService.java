package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.WeatherConditionDTO;
import com.minexpert.hns.dto.response.WeatherConditionResponse;
import com.minexpert.hns.exception.HSException;

public interface WeatherConditionService {
    public Long addWeatherCondition(WeatherConditionDTO weatherConditionDTO) throws HSException;

    public void updateWeatherCondition(WeatherConditionDTO weatherConditionDTO) throws HSException;

    public void deleteWeatherCondition(Long id);

    public WeatherConditionDTO getWeatherConditionById(Long id) throws HSException;

    public void activateWeatherCondition(Long id) throws HSException;

    public List<WeatherConditionResponse> getAllWeatherConditions() throws HSException;

    public List<WeatherConditionResponse> getAllActiveWeatherConditions() throws HSException;

    public void deactivateWeatherCondition(Long id) throws HSException;

    public List<WeatherConditionResponse> getWeatherConditionsByIds(List<Long> ids);
}
