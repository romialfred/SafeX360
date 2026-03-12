package com.minexpert.hns.service.nonConformity;

import java.util.List;

import com.minexpert.hns.dto.nonConformity.NcHistoryDTO;
import com.minexpert.hns.exception.HSException;

public interface NcHistoryService {
    Long saveNcHistory(NcHistoryDTO ncHistoryDTO) throws HSException;

    List<NcHistoryDTO> getNcHistoryByNonConformityId(Long nonConformityId) throws HSException;
}
