package com.minexpert.hns.dosimetry.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.MedicalSurveillance;

@Repository
public interface MedicalSurveillanceRepository extends JpaRepository<MedicalSurveillance, Long> {

    List<MedicalSurveillance> findByWorkerId(Long workerId);

    List<MedicalSurveillance> findByDoctorId(Long doctorId);

    List<MedicalSurveillance> findByWorkerIdOrderByExamDateDesc(Long workerId);
}
