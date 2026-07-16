package com.minexpert.hns.repository.planning;

import com.minexpert.hns.entity.planning.Theme;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ThemeRepository extends CrudRepository<Theme, Long> {
    List<Theme> findAllByMonth(LocalDate month);

    @Query("SELECT t FROM Theme t WHERE FUNCTION('YEAR', t.month) = :year")
    List<Theme> findAllByMonthYear(@Param("year") int year);

    // ── Cloisonnement par mine (companyId) avec repli "null = global" ───────
    // Une mine voit ses propres themes ET les themes globaux (companyId null,
    // seedes pour toutes les mines). companyId null (systeme/allMines) = tout
    // voir (vue consolidee « toutes mines »).

    @Query("SELECT t FROM Theme t WHERE (:companyId IS NULL "
            + "OR t.companyId = :companyId OR t.companyId IS NULL)")
    List<Theme> findAllByCompany(@Param("companyId") Long companyId);

    @Query("SELECT t FROM Theme t WHERE FUNCTION('YEAR', t.month) = :year "
            + "AND (:companyId IS NULL OR t.companyId = :companyId OR t.companyId IS NULL)")
    List<Theme> findAllByMonthYearAndCompany(@Param("year") int year,
            @Param("companyId") Long companyId);
}
