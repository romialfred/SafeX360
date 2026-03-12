package com.minexpert.hns.service.parameters;

import java.util.List;

import com.minexpert.hns.dto.parameters.LocationDTO;
import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.exception.HSException;

public interface LocationService {
    public Long addLocation(LocationDTO locationDTO) throws HSException;

    public void updateLocation(LocationDTO locationDTO) throws HSException;

    public void deleteLocation(Long id);

    public LocationDTO getLocationById(Long id) throws HSException;

    public void activateLocation(Long id) throws HSException;

    public List<LocationResponse> getAllLocations() throws HSException;

    public List<LocationResponse> getAllActiveLocations() throws HSException;

    public void deactivateLocation(Long id) throws HSException;
}
