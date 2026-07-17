package com.minexpert.hns.service.indicator;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.indicator.HsIndicatorDTO;
import com.minexpert.hns.entity.indicator.HsIndicator;
import com.minexpert.hns.enums.IndicatorCategory;
import com.minexpert.hns.enums.IndicatorDirection;
import com.minexpert.hns.enums.IndicatorFrequency;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.indicator.HsIndicatorRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service des definitions d'indicateurs HSE. Patron de cloisonnement standard :
 * companyId requis en ecriture, pose a la creation, filtre en lecture, garde
 * d'appartenance sur get/update/delete. Les valeurs par defaut (category,
 * frequency, direction, active) sont imposees serveur pour que le referentiel
 * reste coherent meme si le client envoie des champs vides.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class HsIndicatorServiceImpl implements HsIndicatorService {

    private final HsIndicatorRepository indicatorRepository;

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    private HsIndicator loadIndicator(Long companyId, Long id) throws HSException {
        if (id == null) {
            throw new HSException("INDICATOR_NOT_FOUND");
        }
        return indicatorRepository.findByIdWithCompanyContext(id, companyId)
                .orElseThrow(() -> new HSException("INDICATOR_NOT_FOUND"));
    }

    /** Code lisible et stable, derive du nom si absent (ex. "LTIFR" ou "TAUX_DE_FORMATION"). */
    private String resolveCode(HsIndicatorDTO dto) {
        if (dto.getCode() != null && !dto.getCode().isBlank()) {
            return dto.getCode().trim().toUpperCase();
        }
        String base = dto.getName() == null ? "" : dto.getName().trim().toUpperCase();
        String slug = base.replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
        return slug.isBlank() ? "IND" : slug;
    }

    private void applyServerDefaults(HsIndicatorDTO dto) {
        if (dto.getCategory() == null) {
            dto.setCategory(IndicatorCategory.LEADING);
        }
        if (dto.getFrequency() == null) {
            dto.setFrequency(IndicatorFrequency.MONTHLY);
        }
        if (dto.getDirection() == null) {
            // Un indicateur "retard" (LAGGING) est presque toujours "moins = mieux" ;
            // les autres, par defaut, "plus = mieux". Modifiable par l'utilisateur.
            dto.setDirection(dto.getCategory() == IndicatorCategory.LAGGING
                    ? IndicatorDirection.LOWER_IS_BETTER
                    : IndicatorDirection.HIGHER_IS_BETTER);
        }
        if (dto.getHasForecast() == null) {
            dto.setHasForecast(Boolean.TRUE);
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "indicatorAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "indicatorForecastable", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long createIndicator(Long companyId, HsIndicatorDTO dto) throws HSException {
        ensureCompanyIdProvided(companyId);
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new HSException("INDICATOR_NAME_REQUIRED");
        }
        String code = resolveCode(dto);
        Optional<HsIndicator> existing = indicatorRepository.findByCompanyIdAndCodeIgnoreCase(companyId, code);
        if (existing.isPresent()) {
            throw new HSException("INDICATOR_ALREADY_EXISTS");
        }
        applyServerDefaults(dto);
        dto.setId(null);
        dto.setCode(code);
        dto.setCompanyId(companyId);
        dto.setActive(Boolean.TRUE);
        dto.setCreatedAt(LocalDateTime.now());
        dto.setUpdatedAt(LocalDateTime.now());
        return indicatorRepository.save(dto.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "indicatorAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "indicatorForecastable", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateIndicator(Long companyId, HsIndicatorDTO dto) throws HSException {
        ensureCompanyIdProvided(companyId);
        HsIndicator existing = loadIndicator(companyId, dto.getId());
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new HSException("INDICATOR_NAME_REQUIRED");
        }
        String code = resolveCode(dto);
        if (!code.equalsIgnoreCase(existing.getCode())) {
            Optional<HsIndicator> clash = indicatorRepository.findByCompanyIdAndCodeIgnoreCase(companyId, code);
            if (clash.isPresent() && !clash.get().getId().equals(existing.getId())) {
                throw new HSException("INDICATOR_ALREADY_EXISTS");
            }
        }
        applyServerDefaults(dto);
        existing.setCode(code);
        existing.setName(dto.getName());
        existing.setDefinition(dto.getDefinition());
        existing.setCategory(dto.getCategory());
        existing.setFrequency(dto.getFrequency());
        existing.setDirection(dto.getDirection());
        existing.setHasForecast(dto.getHasForecast());
        existing.setUnit(dto.getUnit());
        if (dto.getActive() != null) {
            existing.setActive(dto.getActive());
        }
        existing.setCompanyId(companyId);
        existing.setUpdatedAt(LocalDateTime.now());
        indicatorRepository.save(existing);
    }

    @Override
    @Cacheable(cacheNames = "indicatorAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<HsIndicatorDTO> getAllIndicators(Long companyId) throws HSException {
        return indicatorRepository.findAllByCompany(companyId).stream().map(HsIndicator::toDTO).toList();
    }

    @Override
    @Cacheable(cacheNames = "indicatorForecastable", key = "#companyId != null ? #companyId : 'ALL'")
    public List<HsIndicatorDTO> getForecastableIndicators(Long companyId) throws HSException {
        return indicatorRepository.findForecastableByCompany(companyId).stream().map(HsIndicator::toDTO).toList();
    }

    @Override
    public HsIndicatorDTO getIndicatorById(Long companyId, Long id) throws HSException {
        return loadIndicator(companyId, id).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "indicatorAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "indicatorForecastable", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deleteIndicator(Long companyId, Long id) throws HSException {
        ensureCompanyIdProvided(companyId);
        HsIndicator indicator = loadIndicator(companyId, id);
        // Desactivation logique : on preserve les plans historiques rattaches.
        indicator.setActive(Boolean.FALSE);
        indicator.setUpdatedAt(LocalDateTime.now());
        indicatorRepository.save(indicator);
    }
}
