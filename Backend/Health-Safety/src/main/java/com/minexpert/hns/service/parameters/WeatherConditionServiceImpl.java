package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private WeatherCondition loadWeatherCondition(Long companyId, Long id) throws HSException {
        return weatherConditionRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("WEATHER_CONDITION_NOT_FOUND"));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "weatherConditionsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsByIds", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addWeatherCondition(Long companyId, WeatherConditionDTO weatherConditionDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<WeatherCondition> optional = weatherConditionRepository
                .findByCompanyIdAndNameIgnoreCase(companyId, weatherConditionDTO.getName());
        if (optional.isPresent()) {
            throw new HSException("WEATHER_CONDITION_ALREADY_EXISTS");
        }
        weatherConditionDTO.setCompanyId(companyId);
        weatherConditionDTO.setStatus(Status.ACTIVE);
        weatherConditionDTO.setCreatedAt(LocalDateTime.now());
        weatherConditionDTO.setUpdatedAt(LocalDateTime.now());
        return weatherConditionRepository.save(weatherConditionDTO.toEntity()).getId();

    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "weatherConditionById", key = "#companyId != null && #weatherConditionDTO.id != null ? (#companyId + '-' + #weatherConditionDTO.id) : 'ALL-' + #weatherConditionDTO.id", condition = "#weatherConditionDTO.id != null"),
            @CacheEvict(cacheNames = "weatherConditionsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsByIds", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateWeatherCondition(Long companyId, WeatherConditionDTO weatherConditionDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        WeatherCondition existingWeatherCondition = loadWeatherCondition(companyId, weatherConditionDTO.getId());
        if (!existingWeatherCondition.getName().equalsIgnoreCase(weatherConditionDTO.getName())) {
            Optional<WeatherCondition> optional = weatherConditionRepository
                    .findByCompanyIdAndNameIgnoreCase(companyId, weatherConditionDTO.getName());
            if (optional.isPresent()) {
                throw new HSException("WEATHER_CONDITION_ALREADY_EXISTS");
            }
        }
        existingWeatherCondition.setName(weatherConditionDTO.getName());
        existingWeatherCondition.setDescription(weatherConditionDTO.getDescription());
        existingWeatherCondition.setCompanyId(companyId);
        existingWeatherCondition.setUpdatedAt(LocalDateTime.now());
        weatherConditionRepository.save(existingWeatherCondition);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "weatherConditionById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "weatherConditionsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsByIds", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteWeatherCondition(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WeatherCondition weatherCondition = loadWeatherCondition(companyId, id);
        weatherConditionRepository.delete(weatherCondition);
    }

    @Override
    @Cacheable(cacheNames = "weatherConditionById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public WeatherConditionDTO getWeatherConditionById(Long companyId, Long id) throws HSException {
        return loadWeatherCondition(companyId, id).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "weatherConditionById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "weatherConditionsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsByIds", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateWeatherCondition(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WeatherCondition existingWeatherCondition = loadWeatherCondition(companyId, id);
        existingWeatherCondition.setStatus(Status.ACTIVE);
        existingWeatherCondition.setUpdatedAt(LocalDateTime.now());
        weatherConditionRepository.save(existingWeatherCondition);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "weatherConditionById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "weatherConditionsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsActive", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "weatherConditionsByIds", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateWeatherCondition(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        WeatherCondition existingWeatherCondition = loadWeatherCondition(companyId, id);
        existingWeatherCondition.setStatus(Status.INACTIVE);
        existingWeatherCondition.setUpdatedAt(LocalDateTime.now());
        weatherConditionRepository.save(existingWeatherCondition);
    }

    @Override
    @Cacheable(cacheNames = "weatherConditionsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<WeatherConditionResponse> getAllWeatherConditions(Long companyId) throws HSException {
        return weatherConditionRepository.findAllWithName(companyId);
    }

    @Override
    @Cacheable(cacheNames = "weatherConditionsActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<WeatherConditionResponse> getAllActiveWeatherConditions(Long companyId) throws HSException {
        return weatherConditionRepository.findAllByStatus(companyId, Status.ACTIVE);
    }

    @Override
    @Cacheable(cacheNames = "weatherConditionsByIds", key = "#companyId != null ? (#companyId + '-' + #ids) : 'ALL-' + #ids")
    public List<WeatherConditionResponse> getWeatherConditionsByIds(Long companyId, List<Long> ids) {
        return weatherConditionRepository.findByIds(companyId, ids);
    }

}
