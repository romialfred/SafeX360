package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.PpeStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PpeStockRepository extends JpaRepository<PpeStock, Long> {
    List<PpeStock> findByPpeId(Long ppeId);
}
