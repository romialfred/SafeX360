package com.minexpert.hns.repository.nonConformity;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.nonConformity.EventAnalysis;

public interface EventAnalysisRepository extends CrudRepository<EventAnalysis, Long> {
    Boolean existsByNonConformityId(Long nonConformityId);

    Optional<EventAnalysis> findByNonConformityId(Long nonConformityId);

    // Cloisonnement par mine : filtre via le companyId de la NonConformity parente.
    @Query("SELECT ea FROM EventAnalysis ea WHERE ea.nonConformity.id = :nonConformityId "
            + "AND (:companyId IS NULL OR ea.nonConformity.companyId = :companyId)")
    Optional<EventAnalysis> findByNonConformityIdAndCompany(@Param("nonConformityId") Long nonConformityId,
            @Param("companyId") Long companyId);

}
