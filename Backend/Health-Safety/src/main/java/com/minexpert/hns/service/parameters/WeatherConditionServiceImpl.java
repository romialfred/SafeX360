package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.parameters.WeatherConditionDTO;
import com.minexpert.hns.dto.response.WeatherConditionResponse;
import com.minexpert.hns.entity.parameters.WeatherCondition;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.WeatherConditionRepository;

@Service
public class WeatherConditionServiceImpl implements WeatherConditionService {

    @Autowired
    private WeatherConditionRepository weatherConditionRepository;

    @Override
    public Long addWeatherCondition(WeatherConditionDTO weatherConditionDTO) throws HSException {
        Optional<WeatherCondition> optional = weatherConditionRepository
                .findByNameIgnoreCase(weatherConditionDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("WEATHER_CONDITION_ALREADY_EXISTS");
        }
        weatherConditionDTO.setStatus(Status.ACTIVE);
        weatherConditionDTO.setCreatedAt(LocalDateTime.now());
        weatherConditionDTO.setUpdatedAt(LocalDateTime.now());
        return weatherConditionRepository.save(weatherConditionDTO.toEntity()).getId();

    }

    @Override
    public void updateWeatherCondition(WeatherConditionDTO weatherConditionDTO) throws HSException {

        WeatherCondition existingWeatherCondition = weatherConditionRepository.findById(weatherConditionDTO.getId())
                .orElseThrow(() -> new HSException("WEATHER_CONDITION_NOT_FOUND"));
        if (!existingWeatherCondition.getName().equalsIgnoreCase(weatherConditionDTO.getName())) {
            Optional<WeatherCondition> optional = weatherConditionRepository
                    .findByNameIgnoreCase(weatherConditionDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("WEATHER_CONDITION_ALREADY_EXISTS");
            }
        }
        existingWeatherCondition.setName(weatherConditionDTO.getName());
        existingWeatherCondition.setDescription(weatherConditionDTO.getDescription());
        existingWeatherCondition.setUpdatedAt(LocalDateTime.now());
        weatherConditionRepository.save(existingWeatherCondition);
    }

    @Override
    public void deleteWeatherCondition(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteWeatherCondition'");
    }

    @Override
    public WeatherConditionDTO getWeatherConditionById(Long id) throws HSException {
        return weatherConditionRepository.findById(id).map(WeatherCondition::toDTO)
                .orElseThrow(() -> new HSException("WEATHER_CONDITION_NOT_FOUND"));
    }

    @Override
    public void activateWeatherCondition(Long id) throws HSException {
        WeatherCondition existingWeatherCondition = weatherConditionRepository.findById(id)
                .orElseThrow(() -> new HSException("WEATHER_CONDITION_NOT_FOUND"));
        existingWeatherCondition.setStatus(Status.ACTIVE);
        existingWeatherCondition.setUpdatedAt(LocalDateTime.now());
        weatherConditionRepository.save(existingWeatherCondition);
    }

    @Override
    public void deactivateWeatherCondition(Long id) throws HSException {
        WeatherCondition existingWeatherCondition = weatherConditionRepository.findById(id)
                .orElseThrow(() -> new HSException("WEATHER_CONDITION_NOT_FOUND"));
        existingWeatherCondition.setStatus(Status.INACTIVE);
        existingWeatherCondition.setUpdatedAt(LocalDateTime.now());
        weatherConditionRepository.save(existingWeatherCondition);
    }

    @Override
    public List<WeatherConditionResponse> getAllWeatherConditions() throws HSException {
        return weatherConditionRepository.findAllWithName();
    }

    @Override
    public List<WeatherConditionResponse> getAllActiveWeatherConditions() throws HSException {
        return weatherConditionRepository.findAllActiveWeather();
    }

    @Override
    public List<WeatherConditionResponse> getWeatherConditionsByIds(List<Long> ids) {
        return weatherConditionRepository.findByIds(ids);
    }

}
