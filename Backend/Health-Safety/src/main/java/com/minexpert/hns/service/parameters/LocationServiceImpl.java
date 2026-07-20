package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.minexpert.hns.dto.parameters.LocationDTO;
import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.LocationRepository;

@Service
@Transactional
public class LocationServiceImpl implements LocationService {

    @Autowired
    private LocationRepository locationRepository;

    /**
     * Mine effective pour une opération sur un lieu EXISTANT (update / activate /
     * deactivate / delete). Le paramètre {@code companyId} prime s'il désigne une
     * mine précise (utilisateur cloisonné, clampé par la gateway) ; sinon (admin
     * « Toutes les Mines » en vue consolidée, param absent) on DÉRIVE la mine du
     * lieu lui-même. Un utilisateur cloisonné ne peut jamais toucher le lieu d'une
     * autre mine (contrôle de propriété conservé).
     */
    private Long resolveOwningCompany(Long companyId, Location existing) throws HSException {
        Long effective = (companyId != null && companyId > 0) ? companyId : existing.getCompanyId();
        if (effective == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
        if (!effective.equals(existing.getCompanyId())) {
            throw new HSException("LOCATION_NOT_FOUND");
        }
        return effective;
    }

    private void ensureCompanyIdProvided(Long companyId) throws HSException {
        if (companyId == null) {
            throw new HSException("COMPANY_ID_REQUIRED");
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "locationsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "locationsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public Long addLocation(Long companyId, LocationDTO locationDTO) throws HSException {
        ensureCompanyIdProvided(companyId);
        Optional<Location> optional1 = locationRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                locationDTO.getName());
        if (optional1.isPresent()) {
            throw new HSException("LOCATION_ALREADY_EXISTS");
        }
        Optional<Location> optional = locationRepository.findByCompanyIdAndLongitudeAndLatitude(companyId,
                locationDTO.getLongitude(),
                locationDTO.getLatitude());

        if (optional.isPresent()) {
            throw new HSException("LOCATION_ALREADY_EXISTS");
        }
        locationDTO.setStatus(Status.ACTIVE);
        locationDTO.setCompanyId(companyId);
        locationDTO.setCreatedAt(LocalDateTime.now());
        locationDTO.setUpdatedAt(LocalDateTime.now());
        return locationRepository.save(locationDTO.toEntity()).getId();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "locationById", key = "#companyId != null ? (#companyId + '-' + #locationDTO.id) : 'ALL-' + #locationDTO.id", condition = "#locationDTO.id != null"),
            @CacheEvict(cacheNames = "locationsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "locationsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void updateLocation(Long companyId, LocationDTO locationDTO) throws HSException {
        Location existingLocation = locationRepository.findById(locationDTO.getId())
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        // Mine dérivée du lieu existant si absente (édition en vue consolidée).
        companyId = resolveOwningCompany(companyId, existingLocation);
        if (!existingLocation.getName().equalsIgnoreCase(locationDTO.getName())) {
            Optional<Location> optional1 = locationRepository.findByCompanyIdAndNameIgnoreCase(companyId,
                    locationDTO.getName());
            if (optional1.isPresent()) {
                throw new HSException("LOCATION_ALREADY_EXISTS");
            }
        }
        if (!existingLocation.getLongitude().equals(locationDTO.getLongitude())
                || !existingLocation.getLatitude().equals(locationDTO.getLatitude())) {
            Optional<Location> optional = locationRepository.findByCompanyIdAndLongitudeAndLatitude(companyId,
                    locationDTO.getLongitude(),
                    locationDTO.getLatitude());

            if (optional.isPresent()) {
                throw new HSException("LOCATION_ALREADY_EXISTS");
            }
        }

        existingLocation.setName(locationDTO.getName());
        existingLocation.setLongitude(locationDTO.getLongitude());
        existingLocation.setLatitude(locationDTO.getLatitude());
        existingLocation.setUpdatedAt(LocalDateTime.now());
        locationRepository.save(existingLocation);
    }

    @Override
    public void deleteLocation(Long companyId, Long id) throws HSException {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        resolveOwningCompany(companyId, existingLocation);
        locationRepository.delete(existingLocation);
    }

    @Override
    @Cacheable(cacheNames = "locationById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id")
    public LocationDTO getLocationById(Long companyId, Long id) throws HSException {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        if (companyId != null && !companyId.equals(location.getCompanyId())) {
            throw new HSException("LOCATION_NOT_FOUND");
        }
        return location.toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "locationById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "locationsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "locationsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void activateLocation(Long companyId, Long id) throws HSException {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        resolveOwningCompany(companyId, existingLocation);
        existingLocation.setStatus(Status.ACTIVE);
        existingLocation.setUpdatedAt(LocalDateTime.now());
        locationRepository.save(existingLocation);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "locationById", key = "#companyId != null ? (#companyId + '-' + #id) : 'ALL-' + #id"),
            @CacheEvict(cacheNames = "locationsAll", key = "#companyId != null ? #companyId : 'ALL'"),
            @CacheEvict(cacheNames = "locationsActive", key = "#companyId != null ? #companyId : 'ALL'")
    })
    public void deactivateLocation(Long companyId, Long id) throws HSException {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        resolveOwningCompany(companyId, existingLocation);
        existingLocation.setStatus(Status.INACTIVE);
        existingLocation.setUpdatedAt(LocalDateTime.now());
        locationRepository.save(existingLocation);
    }

    @Override
    @Cacheable(cacheNames = "locationsAll", key = "#companyId != null ? #companyId : 'ALL'")
    public List<LocationResponse> getAllLocations(Long companyId) throws HSException {
        return locationRepository.findAllWithName(companyId);
    }

    @Override
    @Cacheable(cacheNames = "locationsActive", key = "#companyId != null ? #companyId : 'ALL'")
    public List<LocationResponse> getAllActiveLocations(Long companyId) throws HSException {
        return locationRepository.findAllActiveLocations(companyId, Status.ACTIVE);
    }

}
