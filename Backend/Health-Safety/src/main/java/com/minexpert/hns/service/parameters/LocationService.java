package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.LocationDTO;
import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.exception.HSException;

public interface LocationService {
    Long addLocation(Long companyId, LocationDTO locationDTO) throws HSException;

    void updateLocation(Long companyId, LocationDTO locationDTO) throws HSException;

    void deleteLocation(Long companyId, Long id) throws HSException;

    LocationDTO getLocationById(Long companyId, Long id) throws HSException;

    void activateLocation(Long companyId, Long id) throws HSException;

    List<LocationResponse> getAllLocations(Long companyId) throws HSException;

    List<LocationResponse> getAllActiveLocations(Long companyId) throws HSException;

    void deactivateLocation(Long companyId, Long id) throws HSException;
}
