package com.minexpert.hns.repository.activities;

import com.minexpert.hns.entity.activities.HsActivityHistory;
import java.util.List;
import org.springframework.data.repository.CrudRepository;

public interface HsActivityHistoryRepository extends CrudRepository<HsActivityHistory, Long> {
    List<HsActivityHistory> findByHsActivityId(Long hsActivityId);
}
