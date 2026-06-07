package com.minexpert.hns.dosimetry.service;

import java.util.List;

import com.minexpert.hns.dosimetry.dto.DoseRecordCreateResultDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordDTO;
import com.minexpert.hns.dosimetry.dto.DoseRecordSupersedeRequestDTO;

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

    // -----------------------------------------------------------------------------------------
    //   PHASE 4 - methodes enrichies avec triggers (cumul + threshold engine + double validation)
    // -----------------------------------------------------------------------------------------

    /**
     * Cree un nouveau DoseRecord pour un worker / periode :
     * <ol>
     *   <li>verifie qu'il n'existe PAS deja un DoseRecord ACTIF (supersededRecordId IS NULL)
     *       pour le couple (worker, period) - sinon {@link IllegalStateException}, exigeant
     *       le passage par {@link #supersedeWithResult(Long, DoseRecordSupersedeRequestDTO)}.</li>
     *   <li>persiste le record (version = 1).</li>
     *   <li>declenche le recalcul {@link DoseCumulativeCalculator#recompute(Long, int)} pour
     *       (workerId, year extrait de period).</li>
     *   <li>declenche {@link ThresholdEngine#evaluateAndCreateAlerts(com.minexpert.hns.dosimetry.entity.DoseRecord)}.</li>
     *   <li>ecrit un audit log (action = CREATE).</li>
     *   <li>positionne {@code requiresDoubleValidation = true} si hp10 &gt; 10 mSv OU
     *       hp007 &gt; 100 mSv OU hp3 &gt; 10 mSv.</li>
     * </ol>
     */
    DoseRecordCreateResultDTO createWithResult(Long companyId, DoseRecordDTO dto);

    /**
     * Cree une nouvelle version (supersede) d'un DoseRecord existant :
     * <ol>
     *   <li>verifie que le record d'origine existe et n'est pas deja superseded
     *       (chainage scelle) - sinon {@link IllegalStateException}.</li>
     *   <li>cree un NOUVEAU record avec version = original.version + 1 et les nouvelles valeurs.</li>
     *   <li>met a jour superseded_record_id de l'original via
     *       {@code DoseRecordRepository#updateSupersededRecordId} (seule colonne mutable).</li>
     *   <li>declenche le recalcul cumul + threshold engine.</li>
     *   <li>ecrit un audit log (action = SUPERSEDE, details = {originalId, reason, newId}).</li>
     * </ol>
     */
    DoseRecordCreateResultDTO supersedeWithResult(Long companyId, DoseRecordSupersedeRequestDTO request);
}
