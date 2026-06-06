package com.minexpert.hns.api.emergency.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.minexpert.hns.api.emergency.entity.EmergencySettings;

/** Accès BDD au singleton paramètres Emergency par mine. */
public interface EmergencySettingsRepository extends JpaRepository<EmergencySettings, Long> {

    Optional<EmergencySettings> findByCompanyId(Long companyId);
}
