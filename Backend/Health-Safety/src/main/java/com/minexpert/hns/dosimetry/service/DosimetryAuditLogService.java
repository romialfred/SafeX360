package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DosimetryAuditLogDTO;

/**
 * DosimetryAuditLog est append-only.
 * Le "create" est conserve pour usage interne (autres services), mais update/delete
 * doivent etre interpretes comme NO-OP cote API (triggers SQL bloquent toute mutation).
 */
public interface DosimetryAuditLogService {

    Long create(Long companyId, DosimetryAuditLogDTO dto);

    List<DosimetryAuditLogDTO> getAll(Long companyId);

    DosimetryAuditLogDTO getById(Long id);
}
