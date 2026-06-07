package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.Qualification;
import com.minexpert.hns.dosimetry.enums.QualifStatus;

@Repository
public interface QualificationRepository extends JpaRepository<Qualification, Long> {

    List<Qualification> findByWorkerId(Long workerId);

    List<Qualification> findByStatus(QualifStatus status);

    List<Qualification> findByWorkerIdAndStatus(Long workerId, QualifStatus status);
}
