package com.minexpert.hns.repository.chemicalrisks;

import com.minexpert.hns.entity.chemicalrisks.ChemicalRiskAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChemicalRiskAnalysisRepository extends JpaRepository<ChemicalRiskAnalysis, Long> {
    List<ChemicalRiskAnalysis> findByChemicalRiskId(Long chemicalRiskId);
}

