package com.minexpert.hns.blast.service;

import com.minexpert.hns.blast.dto.BlastSettingDTO;

/**
 * Service des parametres du module Blast (offsets de rappel, SMTP, timezone par
 * defaut). Une ligne par mine.
 */
public interface BlastSettingService {

    /** Renvoie les parametres de la mine. Cree le defaut si inexistant. */
    BlastSettingDTO getByMineId(Long mineId);

    /** Met a jour tous les champs (BLAST_ADMIN uniquement cote controller). */
    void update(BlastSettingDTO dto, Long userId);
}
