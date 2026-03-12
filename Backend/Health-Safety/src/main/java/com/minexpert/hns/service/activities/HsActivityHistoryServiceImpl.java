package com.minexpert.hns.service.activities;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.minexpert.hns.dto.HsActivityHistoryDTO;
import com.minexpert.hns.entity.activities.HsActivityHistory;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.activities.HsActivityHistoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HsActivityHistoryServiceImpl implements HsActivityHistoryService {

    private final HsActivityHistoryRepository hsActivityHistoryRepository;
    private final HsActivityService activityService;

    @Override
    public Long saveHsActivityHistory(HsActivityHistoryDTO hsActivityHistoryDTO) throws HSException {
        hsActivityHistoryDTO.setCreatedAt(LocalDateTime.now());
        activityService.updateActivityStatus(hsActivityHistoryDTO.getHsActivityId(), hsActivityHistoryDTO.getStatus());
        return hsActivityHistoryRepository.save(hsActivityHistoryDTO.toEntity()).getId();
    }

    @Override
    public List<HsActivityHistoryDTO> getHsActivityHistoryByHsActivityId(Long hsActivityId) throws HSException {
        List<HsActivityHistory> histories = hsActivityHistoryRepository.findByHsActivityId(hsActivityId);
        return histories.stream().map(h -> new HsActivityHistoryDTO(
                h.getId(),
                h.getOwnerId(),
                h.getDate(),
                h.getStatus(),
                h.getComment(),
                h.getHsActivity() != null ? h.getHsActivity().getId() : null,
                h.getCreatedAt())).collect(Collectors.toList());
    }
}
