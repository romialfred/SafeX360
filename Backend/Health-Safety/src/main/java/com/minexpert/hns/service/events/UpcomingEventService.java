package com.minexpert.hns.service.events;

import java.util.List;

import com.minexpert.hns.dto.events.UpcomingEventDTO;

public interface UpcomingEventService {
    List<UpcomingEventDTO> getUpcomingEvents();
}
