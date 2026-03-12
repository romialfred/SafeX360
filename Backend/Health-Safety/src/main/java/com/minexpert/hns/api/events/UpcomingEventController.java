package com.minexpert.hns.api.events;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.events.UpcomingEventDTO;
import com.minexpert.hns.service.events.UpcomingEventService;

@RestController
@RequestMapping("/events")
@CrossOrigin
public class UpcomingEventController {

    private final UpcomingEventService upcomingEventService;

    public UpcomingEventController(UpcomingEventService upcomingEventService) {
        this.upcomingEventService = upcomingEventService;
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<UpcomingEventDTO>> getUpcomingEvents() {
        return ResponseEntity.ok(upcomingEventService.getUpcomingEvents());
    }
}
