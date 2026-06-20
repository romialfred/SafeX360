package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.ErrorEventHistory;

public interface ErrorEventHistoryRepository extends CrudRepository<ErrorEventHistory, Long> {

    List<ErrorEventHistory> findByErrorEventIdOrderByTimestampAsc(Long errorEventId);
}
