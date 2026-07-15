package com.minexpert.hns.repository.chemicalrisks;

import com.minexpert.hns.entity.chemicalrisks.ChemicalRiskAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChemicalRiskAnalysisRepository extends JpaRepository<ChemicalRiskAnalysis, Long> {
    List<ChemicalRiskAnalysis> findByChemicalRiskId(Long chemicalRiskId);

    @Query("SELECT a FROM ChemicalRiskAnalysis a WHERE a.chemicalRisk.id = :chemicalRiskId "
            + "AND (:companyId IS NULL OR a.companyId = :companyId)")
    List<ChemicalRiskAnalysis> findByChemicalRiskIdAndCompany(@Param("chemicalRiskId") Long chemicalRiskId,
            @Param("companyId") Long companyId);

    @Query("SELECT a FROM ChemicalRiskAnalysis a WHERE (:companyId IS NULL OR a.companyId = :companyId)")
    List<ChemicalRiskAnalysis> findAllByCompany(@Param("companyId") Long companyId);
}

