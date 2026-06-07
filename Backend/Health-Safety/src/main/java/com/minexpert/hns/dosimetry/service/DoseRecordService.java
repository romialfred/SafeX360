package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;

public interface DoseRecordService {

    Long create(Long companyId, DoseRecordDTO dto);

    /**
     * APPEND-ONLY : la mise a jour ne modifie pas l'enregistrement existant. Elle cree un
     * NOUVEAU DoseRecord avec version+1 et fixe supersededRecordId sur l'ancien.
     * Renvoie l'id du nouvel enregistrement.
     */
    Long supersede(Long companyId, DoseRecordDTO dto);

    List<DoseRecordDTO> getAll(Long companyId);

    DoseRecordDTO getById(Long id);

    void delete(Long id);

    List<DoseRecordDTO> getActiveByWorkerId(Long workerId);
}
