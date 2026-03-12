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
}
