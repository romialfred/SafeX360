package com.minexpert.hns.repository.nonConformity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.minexpert.hns.dto.nonConformity.NcInfo;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.EventType;

public interface NonConformityRepository extends CrudRepository<NonConformity, Long> {
    @Query("SELECT i FROM NonConformity i WHERE FUNCTION('YEAR', i.createdAt) = :year ORDER BY i.id DESC")
    List<NonConformity> findTopByYearOrderByIdDesc(@Param("year") int year, Pageable pageable);

    @Query("""
                SELECT new com.minexpert.hns.dto.nonConformity.NcInfo(
                    nc.id,
                    nc.type,
                    nc.number,
                    nc.title,
                    nc.date,
                    nc.reportedBy,
                    null,
                    ea.severityLevel,
                    ea.priority,
                    ea.deadline,
                    nc.status
                )
                FROM NonConformity nc
                LEFT JOIN EventAnalysis ea ON ea.nonConformity.id = nc.id
            """)
    List<NcInfo> findAllNcInfo();

    @Query("SELECT new com.minexpert.hns.dto.nonConformity.NcInfo(" +
            "nc.id, nc.type, nc.number, nc.title, nc.date, nc.reportedBy, " +
            "null, ea.severityLevel, ea.priority,  null,  nc.status) " +
            "FROM NonConformity nc LEFT JOIN EventAnalysis ea ON ea.nonConformity.id = nc.id " +
            "WHERE nc.id = ?1")
    Optional<NcInfo> findNcInfoById(Long id);

    Optional<NonConformity> findFirstByTypeAndDateGreaterThanEqualAndStatusNotInOrderByDateAsc(EventType type,
            LocalDate date, List<EventStatus> excludedStatuses);

    /** LOT 52 — total des non-conformités ouvertes (fallback du score de risque). */
    long countByStatusNotIn(List<EventStatus> excludedStatuses);
}
