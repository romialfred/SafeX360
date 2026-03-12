package com.minexpert.hns.repository.ppe;

import com.minexpert.hns.entity.ppe.Ppe;
import com.minexpert.hns.entity.ppe.PpeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PpeRepository extends JpaRepository<Ppe, Long> {
    List<Ppe> findByStatus(PpeStatus status);

    // Find PPE items where current stock is below minimum stock
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Ppe p WHERE p.stock < p.minStock")
    List<Ppe> findLowStock();

    List<Ppe> findByIdIn(List<Long> ids);
}
