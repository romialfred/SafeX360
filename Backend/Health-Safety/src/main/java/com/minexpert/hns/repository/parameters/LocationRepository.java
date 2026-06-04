package com.minexpert.hns.repository.parameters;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.response.LocationResponse;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.enums.Status;

public interface LocationRepository extends CrudRepository<Location, Long> {
    Optional<Location> findByCompanyIdAndNameIgnoreCase(Long companyId, String name);

    Optional<Location> findByCompanyIdAndLongitudeAndLatitude(Long companyId, Double longitude, Double latitude);

    @Query("SELECT l.id AS id, l.name AS name, l.longitude AS longitude, l.latitude AS latitude, l.status AS status, l.companyId AS companyId FROM Location l WHERE (:companyId IS NULL OR l.companyId = :companyId)")
    List<LocationResponse> findAllWithName(@Param("companyId") Long companyId);

    @Query("SELECT l.id AS id, l.name AS name, l.longitude AS longitude, l.latitude AS latitude, l.status AS status, l.companyId AS companyId FROM Location l WHERE l.status = :status AND (:companyId IS NULL OR l.companyId = :companyId)")
    List<LocationResponse> findAllActiveLocations(@Param("companyId") Long companyId, @Param("status") Status status);
}
