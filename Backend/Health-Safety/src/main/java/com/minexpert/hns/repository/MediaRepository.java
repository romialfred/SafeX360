package com.minexpert.hns.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.Media;

public interface MediaRepository extends CrudRepository<Media, Long> {

    List<Media> findAllByIdIn(List<Long> mediaIdArray);

    /** Mine propriétaire d'un média (garde d'appartenance sur GET/DELETE /media/{id}). */
    @Query("SELECT m.companyId FROM Media m WHERE m.id = :id")
    Optional<Long> findCompanyIdById(@org.springframework.data.repository.query.Param("id") Long id);
}
