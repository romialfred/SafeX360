package com.minexpert.hns.repository.indicator;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.entity.indicator.HsIndicator;

/**
 * Repository des definitions d'indicateurs. Scoping mine par le motif
 * (:companyId IS NULL OR i.companyId = :companyId) : companyId null (appel
 * systeme / allMines) ne filtre pas ; sinon filtre strict.
 */
public interface HsIndicatorRepository extends CrudRepository<HsIndicator, Long> {

    @Query("SELECT i FROM HsIndicator i WHERE (:companyId IS NULL OR i.companyId = :companyId) "
            + "ORDER BY CASE WHEN i.active = true THEN 0 ELSE 1 END, i.name ASC")
    List<HsIndicator> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT i FROM HsIndicator i WHERE i.active = true AND i.hasForecast = true "
            + "AND (:companyId IS NULL OR i.companyId = :companyId) ORDER BY i.name ASC")
    List<HsIndicator> findForecastableByCompany(@Param("companyId") Long companyId);

    @Query("SELECT i FROM HsIndicator i WHERE i.id = :id AND (:companyId IS NULL OR i.companyId = :companyId)")
    Optional<HsIndicator> findByIdWithCompanyContext(@Param("id") Long id, @Param("companyId") Long companyId);

    Optional<HsIndicator> findByCompanyIdAndCodeIgnoreCase(Long companyId, String code);
}
