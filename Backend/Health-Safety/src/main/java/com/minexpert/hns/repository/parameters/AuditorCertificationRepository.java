package com.minexpert.hns.repository.parameters;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.parameters.AuditorCertification;

/**
 * LOT 52 — Accès aux certifications des auditeurs internes (ISO 19011:2018 §7).
 */
public interface AuditorCertificationRepository extends CrudRepository<AuditorCertification, Long> {

    List<AuditorCertification> findByInternalAuditorIdOrderByExpiryDateAsc(Long internalAuditorId);
}
