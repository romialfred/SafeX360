package com.minexpert.hns.dto.events;

import java.time.LocalDate;

public class UpcomingEventDTO {
    private final Long id;
    private final String title;
    private final String type;
    private final LocalDate scheduledDate;
    private final String location;
    private final String description;

    public UpcomingEventDTO(Long id, String title, String type, LocalDate scheduledDate, String location,
            String description) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.scheduledDate = scheduledDate;
        this.location = location;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getType() {
        return type;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public String getLocation() {
        return location;
    }

    public String getDescription() {
        return description;
    }
}
