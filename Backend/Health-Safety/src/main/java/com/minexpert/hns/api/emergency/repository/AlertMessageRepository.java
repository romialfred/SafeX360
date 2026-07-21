package com.minexpert.hns.api.emergency.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.AlertMessage;

public interface AlertMessageRepository extends JpaRepository<AlertMessage, Long> {

    List<AlertMessage> findByGeneralAlertIdOrderByCreatedAtAsc(Long generalAlertId);
}
