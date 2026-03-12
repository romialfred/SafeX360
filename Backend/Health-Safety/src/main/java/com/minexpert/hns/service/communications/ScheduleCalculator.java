package com.minexpert.hns.service.communications;

import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.DayOfWeek;
import com.minexpert.hns.entity.communications.ScheduleType;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Objects;

/**
 * Provides schedule calculations for communications.
 */
@Component
public class ScheduleCalculator {

    /**
     * Compute the first run for a newly created or re-activated CommTime.
     */
    public Instant computeInitialNextRunAt(CommTime commTime) {
        Objects.requireNonNull(commTime, "commTime must not be null");
        ZoneId zone = resolveZone(commTime);
        ZonedDateTime now = ZonedDateTime.now(zone);

        return switch (requireType(commTime)) {
            case ONE_TIME -> toInstant(commTime.getOneTimeAt(), zone);
            case WEEKLY -> computeNextWeekly(now, commTime).toInstant();
            case BI_WEEKLY -> computeNextWeekly(now, commTime).toInstant();
            case MONTHLY -> computeNextMonthly(now, commTime).toInstant();
        };
    }

    /**
     * Compute the next run after a successful dispatch.
     */
    public Instant computeNextAfterSuccess(CommTime commTime, Instant justSentAtUtc) {
        Objects.requireNonNull(commTime, "commTime must not be null");
        Objects.requireNonNull(justSentAtUtc, "justSentAtUtc must not be null");
        ZoneId zone = resolveZone(commTime);
        ZonedDateTime sentAt = ZonedDateTime.ofInstant(justSentAtUtc, zone);

        return switch (requireType(commTime)) {
            case ONE_TIME -> null;
            case WEEKLY -> computeNextWeekly(sentAt, commTime).toInstant();
            case BI_WEEKLY -> computeNextWeekly(sentAt, commTime).plusWeeks(1).toInstant();
            case MONTHLY -> computeNextMonthly(sentAt, commTime).toInstant();
        };
    }

    private ScheduleType requireType(CommTime commTime) {
        ScheduleType type = commTime.getScheduleType();
        if (type == null) {
            throw new IllegalStateException("scheduleType required");
        }
        return type;
    }

    private ZonedDateTime computeNextWeekly(ZonedDateTime reference, CommTime commTime) {
        java.time.DayOfWeek targetDay = mapDay(commTime.getWeeklyDay());
        LocalTime timeOfDay = requireTime(commTime.getTimeOfDay(), "timeOfDay required for weekly schedule");

        ZonedDateTime candidate = reference
                .with(TemporalAdjusters.nextOrSame(targetDay))
                .with(timeOfDay);
        if (!candidate.isAfter(reference)) {
            candidate = candidate.plusWeeks(1);
        }
        return candidate;
    }

    private ZonedDateTime computeNextMonthly(ZonedDateTime reference, CommTime commTime) {
        Integer requestedDay = commTime.getMonthlyDay();
        LocalTime timeOfDay = requireTime(commTime.getTimeOfDay(), "timeOfDay required for monthly schedule");
        if (requestedDay == null) {
            throw new IllegalStateException("monthlyDay required for monthly schedule");
        }

        ZonedDateTime candidate = atDayClamped(YearMonth.from(reference), requestedDay, timeOfDay, reference.getZone());
        if (!candidate.isAfter(reference)) {
            YearMonth nextMonth = YearMonth.from(reference).plusMonths(1);
            candidate = atDayClamped(nextMonth, requestedDay, timeOfDay, reference.getZone());
        }
        return candidate;
    }

    private ZonedDateTime atDayClamped(YearMonth month, int requestedDay, LocalTime time, ZoneId zone) {
        int day = Math.max(1, Math.min(requestedDay, month.lengthOfMonth()));
        return ZonedDateTime.of(month.atDay(day), time, zone);
    }

    private java.time.DayOfWeek mapDay(DayOfWeek day) {
        if (day == null) {
            throw new IllegalStateException("weeklyDay required for weekly schedule");
        }
        return java.time.DayOfWeek.valueOf(day.name());
    }

    private LocalTime requireTime(LocalTime time, String message) {
        if (time == null) {
            throw new IllegalStateException(message);
        }
        return time;
    }

    private Instant toInstant(LocalDateTime localDateTime, ZoneId zone) {
        if (localDateTime == null) {
            throw new IllegalStateException("oneTimeAt required for one-time schedule");
        }
        return localDateTime.atZone(zone).toInstant();
    }

    private ZoneId resolveZone(CommTime commTime) {
        return ZoneId.systemDefault();
    }
}

