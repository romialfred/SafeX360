package com.minexpert.hns.repository.incident.projection;

public interface MonthlyClosureSummary {
    Integer getMonth();

    Long getTotalIncidents();

    Long getClosedIncidents();
}
