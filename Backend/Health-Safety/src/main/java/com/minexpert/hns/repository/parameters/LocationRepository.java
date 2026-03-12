package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.entity.parameters.Location;

public interface LocationRepository extends CrudRepository<Location, Long> {
    Optional<Location> findByNameIgnoreCase(String name);

    Optional<Location> findByLongitudeAndLatitude(Double longitude, Double latitude);

    @Query("SELECT l.id AS id, l.name AS name, l.longitude AS longitude,l.latitude as latitude, l.status AS status FROM Location l")
    List<LocationResponse> findAllWithName();

    @Query("SELECT l.id AS id, l.name AS name, l.longitude AS longitude,l.latitude as latitude FROM Location l where l.status = Status.ACTIVE")
    List<LocationResponse> findAllActiveLocations();
}
