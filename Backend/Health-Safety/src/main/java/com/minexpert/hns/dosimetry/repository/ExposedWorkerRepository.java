package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.ExposedWorker;

/**
 * Repository des travailleurs exposes.
 *
 * <p>Note : la notion de "company" est portee par l'isolation logique mineId (la mine appartient
 * a une company dans le module RH). Les requetes findByCompanyId s'appuient donc sur mineId
 * lorsque le filtrage doit etre fait via le module Dosimetrie.
 */
@Repository
public interface ExposedWorkerRepository extends JpaRepository<ExposedWorker, Long> {

    List<ExposedWorker> findByMineId(Long mineId);

    /** Compat. avec la convention companyId : equivalent a findByMineId pour ce module. */
    default List<ExposedWorker> findByCompanyId(Long companyId) {
        return findByMineId(companyId);
    }

    Optional<ExposedWorker> findByEmployeeId(Long employeeId);

    List<ExposedWorker> findByActiveTrue();

    List<ExposedWorker> findByMineIdAndActiveTrue(Long mineId);
}
