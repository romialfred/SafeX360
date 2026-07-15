package com.minexpert.hns.repository.chemicalrisks;

import com.minexpert.hns.entity.chemicalrisks.ChemicalRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChemicalRiskRepository extends JpaRepository<ChemicalRisk, Long> {

    @Query("SELECT c FROM ChemicalRisk c WHERE (:companyId IS NULL OR c.companyId = :companyId)")
    List<ChemicalRisk> findAllByCompany(@Param("companyId") Long companyId);
}

