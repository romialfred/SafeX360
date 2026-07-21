package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.SosMessage;

public interface SosMessageRepository extends JpaRepository<SosMessage, Long> {

    List<SosMessage> findBySosAlertIdOrderByCreatedAtAsc(Long sosAlertId);
}
