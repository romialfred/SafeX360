package com.minexpert.hns.repository.risks;

import com.minexpert.hns.entity.risks.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpportunityRepository extends JpaRepository<Opportunity, Long> {
    List<Opportunity> findAllByOrderByCreatedAtDesc();
}
