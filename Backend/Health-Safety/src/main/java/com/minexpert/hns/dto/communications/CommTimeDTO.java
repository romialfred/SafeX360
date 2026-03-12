package com.minexpert.hns.dto.communications;

import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.DayOfWeek;
import com.minexpert.hns.entity.communications.ScheduleType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Schedule payload used when creating or updating communication timings.
 */
public class CommTimeDTO {

    private Long id;
    private ScheduleType scheduleType;
    private CommStatus status;
    private LocalTime timeOfDay;
    private LocalDateTime oneTimeAt;
    private DayOfWeek weeklyDay;
    private Integer monthlyDay;
    private Instant nextRunAt;
    private Instant lastRunAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ScheduleType getScheduleType() {
        return scheduleType;
    }

    public void setScheduleType(ScheduleType scheduleType) {
        this.scheduleType = scheduleType;
    }

    public CommStatus getStatus() {
        return status;
    }

    public void setStatus(CommStatus status) {
        this.status = status;
    }

    public LocalTime getTimeOfDay() {
        return timeOfDay;
    }

    public void setTimeOfDay(LocalTime timeOfDay) {
        this.timeOfDay = timeOfDay;
    }

    public LocalDateTime getOneTimeAt() {
        return oneTimeAt;
    }

    public void setOneTimeAt(LocalDateTime oneTimeAt) {
        this.oneTimeAt = oneTimeAt;
    }

    public DayOfWeek getWeeklyDay() {
        return weeklyDay;
    }

    public void setWeeklyDay(DayOfWeek weeklyDay) {
        this.weeklyDay = weeklyDay;
    }

    public Integer getMonthlyDay() {
        return monthlyDay;
    }

    public void setMonthlyDay(Integer monthlyDay) {
        this.monthlyDay = monthlyDay;
    }

    public Instant getNextRunAt() {
        return nextRunAt;
    }

    public void setNextRunAt(Instant nextRunAt) {
        this.nextRunAt = nextRunAt;
    }

    public Instant getLastRunAt() {
        return lastRunAt;
    }

    public void setLastRunAt(Instant lastRunAt) {
        this.lastRunAt = lastRunAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean hasSchedule() {
        return scheduleType != null;
    }

    public CommTime toEntity() {
        CommTime commTime = new CommTime();
        applyTo(commTime);
        return commTime;
    }

    public void applyTo(CommTime commTime) {
        commTime.setScheduleType(scheduleType);
        commTime.setTimeOfDay(timeOfDay);
        commTime.setOneTimeAt(oneTimeAt);
        commTime.setWeeklyDay(weeklyDay);
        commTime.setMonthlyDay(monthlyDay);
    }

    public static CommTimeDTO fromEntity(CommTime commTime) {
        if (commTime == null) {
            return null;
        }
        CommTimeDTO dto = new CommTimeDTO();
        dto.setId(commTime.getId());
        dto.setScheduleType(commTime.getScheduleType());
        dto.setStatus(commTime.getStatus());
        dto.setTimeOfDay(commTime.getTimeOfDay());
        dto.setOneTimeAt(commTime.getOneTimeAt());
        dto.setWeeklyDay(commTime.getWeeklyDay());
        dto.setMonthlyDay(commTime.getMonthlyDay());
        dto.setNextRunAt(commTime.getNextRunAt());
        dto.setLastRunAt(commTime.getLastRunAt());
        dto.setCreatedAt(commTime.getCreatedAt());
        dto.setUpdatedAt(commTime.getUpdatedAt());
        return dto;
    }
}
