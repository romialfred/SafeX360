package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeStocktakeLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PpeStocktakeLineRepository extends JpaRepository<PpeStocktakeLine, Long> {

    /** Lignes d'une session d'inventaire. */
    List<PpeStocktakeLine> findByStocktakeId(Long stocktakeId);
}
