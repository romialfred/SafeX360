package com.minexpert.hns.service.parameters;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.parameters.LocationDTO;
import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.parameters.LocationRepository;

@Service
public class LocationServiceImpl implements LocationService {

    @Autowired
    private LocationRepository locationRepository;

    @Override
    public Long addLocation(LocationDTO locationDTO) throws HSException {
        Optional<Location> optional1 = locationRepository.findByNameIgnoreCase(locationDTO.getName());
        if (optional1.isPresent()) {
            throw new HSException("LOCATION_ALREADY_EXISTS");
        }
        Optional<Location> optional = locationRepository.findByLongitudeAndLatitude(locationDTO.getLongitude(),
                locationDTO.getLatitude());

        if (optional.isPresent()) {
            throw new HSException("LOCATION_ALREADY_EXISTS");
        }
        locationDTO.setStatus(Status.ACTIVE);
        locationDTO.setCreatedAt(LocalDateTime.now());
        locationDTO.setUpdatedAt(LocalDateTime.now());
        return locationRepository.save(locationDTO.toEntity()).getId();
    }

    @Override
    public void updateLocation(LocationDTO locationDTO) throws HSException {
        Location existingLocation = locationRepository.findById(locationDTO.getId())
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        if (!existingLocation.getName().equalsIgnoreCase(locationDTO.getName())) {
            Optional<Location> optional1 = locationRepository.findByNameIgnoreCase(locationDTO.getName());
            if (optional1.isPresent()) {
                throw new HSException("LOCATION_ALREADY_EXISTS");
            }
        }
        if (!existingLocation.getLongitude().equals(locationDTO.getLongitude())
                || !existingLocation.getLatitude().equals(locationDTO.getLatitude())) {
            Optional<Location> optional = locationRepository.findByLongitudeAndLatitude(locationDTO.getLongitude(),
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
    public void deleteLocation(Long id) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteLocation'");
    }

    @Override
    public LocationDTO getLocationById(Long id) throws HSException {
        return locationRepository.findById(id).map(Location::toDTO)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
    }

    @Override
    public void activateLocation(Long id) throws HSException {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        existingLocation.setStatus(Status.ACTIVE);
        existingLocation.setUpdatedAt(LocalDateTime.now());
        locationRepository.save(existingLocation);
    }

    @Override
    public void deactivateLocation(Long id) throws HSException {
        Location existingLocation = locationRepository.findById(id)
                .orElseThrow(() -> new HSException("LOCATION_NOT_FOUND"));
        existingLocation.setStatus(Status.INACTIVE);
        existingLocation.setUpdatedAt(LocalDateTime.now());
        locationRepository.save(existingLocation);
    }

    @Override
    public List<LocationResponse> getAllLocations() throws HSException {
        return locationRepository.findAllWithName();
    }

    @Override
    public List<LocationResponse> getAllActiveLocations() throws HSException {
        return locationRepository.findAllActiveLocations();
    }

}
