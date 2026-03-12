package com.minexpert.hns.repository.planning;

import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityRepository extends CrudRepository<Activity, Long> {
    List<Activity> findAllByMonth(LocalDate month);

    @Query("SELECT a FROM Activity a WHERE FUNCTION('YEAR', a.month) = :year AND (:status IS NULL OR a.status = :status) AND (:category IS NULL OR a.category = :category)")
    List<Activity> findByYearAndStatusAndCategory(@Param("year") int year, @Param("status") ActivityStatus status,
            @Param("category") ActivityCategory category);

}
