package com.minexpert.hns.dto.response;

public class YearlyClosureData {
    private final String date;
    private final long totalIncidents;
    private final long closedIncidents;

    public YearlyClosureData(String date, long totalIncidents, long closedIncidents) {
        this.date = date;
        this.totalIncidents = totalIncidents;
        this.closedIncidents = closedIncidents;
    }

    public String getDate() {
        return date;
    }

    public long getTotalIncidents() {
        return totalIncidents;
    }

    public long getClosedIncidents() {
        return closedIncidents;
    }
}
