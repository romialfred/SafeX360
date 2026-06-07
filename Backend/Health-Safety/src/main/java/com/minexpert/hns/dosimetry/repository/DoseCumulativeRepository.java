package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.DoseCumulative;

@Repository
public interface DoseCumulativeRepository extends JpaRepository<DoseCumulative, Long> {

    Optional<DoseCumulative> findByWorkerIdAndYear(Long workerId, int year);

    List<DoseCumulative> findByWorkerId(Long workerId);

    List<DoseCumulative> findByWorkerIdOrderByYearDesc(Long workerId);
}
