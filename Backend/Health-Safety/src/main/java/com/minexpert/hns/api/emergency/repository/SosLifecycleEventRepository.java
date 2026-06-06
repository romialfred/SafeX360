package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.SosLifecycleEvent;

public interface SosLifecycleEventRepository extends JpaRepository<SosLifecycleEvent, Long> {

    List<SosLifecycleEvent> findBySosAlertIdOrderByCreatedAtAsc(Long sosAlertId);
}
