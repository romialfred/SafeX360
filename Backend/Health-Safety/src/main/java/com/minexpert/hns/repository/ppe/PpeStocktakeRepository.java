package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeStocktake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PpeStocktakeRepository extends JpaRepository<PpeStocktake, Long> {

    /** Inventaires d'une mine, du plus récent au plus ancien ; companyId null = pas de filtre. */
    @Query("SELECT s FROM PpeStocktake s WHERE (:companyId IS NULL OR s.companyId = :companyId) "
            + "ORDER BY s.createdAt DESC, s.id DESC")
    List<PpeStocktake> findAllByCompany(@Param("companyId") Long companyId);
}
