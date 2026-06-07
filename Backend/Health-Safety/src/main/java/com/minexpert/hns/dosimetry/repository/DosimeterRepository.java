package com.minexpert.hns.dosimetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.minexpert.hns.dosimetry.entity.Dosimeter;
import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.enums.DosimeterType;

@Repository
public interface DosimeterRepository extends JpaRepository<Dosimeter, Long> {

    List<Dosimeter> findByMineId(Long mineId);

    /** Compat. avec la convention companyId : equivalent a findByMineId pour ce module. */
    default List<Dosimeter> findByCompanyId(Long companyId) {
        return findByMineId(companyId);
    }

    Optional<Dosimeter> findBySerial(String serial);

    Optional<Dosimeter> findByQrCode(String qrCode);

    List<Dosimeter> findByStatus(DosimeterStatus status);

    List<Dosimeter> findByMineIdAndStatus(Long mineId, DosimeterStatus status);

    List<Dosimeter> findByType(DosimeterType type);
}
