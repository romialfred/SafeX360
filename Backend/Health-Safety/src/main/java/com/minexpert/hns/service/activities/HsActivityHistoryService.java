package com.minexpert.hns.service.activities;

import java.util.List;

import com.minexpert.hns.dto.HsActivityHistoryDTO;
import com.minexpert.hns.exception.HSException;

public interface HsActivityHistoryService {
    Long saveHsActivityHistory(HsActivityHistoryDTO hsActivityHistoryDTO) throws HSException;

    List<HsActivityHistoryDTO> getHsActivityHistoryByHsActivityId(Long hsActivityId) throws HSException;
}
