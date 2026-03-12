package com.minexpert.hns.service.communications;

import com.minexpert.hns.entity.communications.CommStatus;
import com.minexpert.hns.entity.communications.CommTime;
import com.minexpert.hns.entity.communications.ScheduleType;
import com.minexpert.hns.repository.communications.CommTimeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

/**
 * Initializes CommTime records by validating configuration and calculating the first run.
 */
@Service
public class CommTimeInitService {

    private final ScheduleCalculator scheduleCalculator;
    private final CommTimeRepository commTimeRepository;

    public CommTimeInitService(ScheduleCalculator scheduleCalculator,
                               CommTimeRepository commTimeRepository) {
        this.scheduleCalculator = Objects.requireNonNull(scheduleCalculator, "scheduleCalculator must not be null");
        this.commTimeRepository = Objects.requireNonNull(commTimeRepository, "commTimeRepository must not be null");
    }

    @Transactional
    public CommTime initializeAndActivate(CommTime commTime) {
        Objects.requireNonNull(commTime, "commTime must not be null");
        ScheduleType type = commTime.getScheduleType();
        if (type == null) {
            throw new IllegalArgumentException("scheduleType required");
        }

        switch (type) {
            case ONE_TIME -> require(commTime.getOneTimeAt() != null, "oneTimeAt required for one-time schedules");
            case WEEKLY, BI_WEEKLY -> {
                require(commTime.getWeeklyDay() != null, "weeklyDay required for weekly schedules");
                require(commTime.getTimeOfDay() != null, "timeOfDay required for weekly schedules");
            }
            case MONTHLY -> {
                require(commTime.getMonthlyDay() != null, "monthlyDay required for monthly schedules");
                require(commTime.getTimeOfDay() != null, "timeOfDay required for monthly schedules");
            }
        }

        commTime.setStatus(CommStatus.ACTIVE);
        if (commTime.getId() == null) {
            commTime.setLastRunAt(null);
        }

        Instant nextRun = scheduleCalculator.computeInitialNextRunAt(commTime);
        commTime.setNextRunAt(nextRun);

        return commTimeRepository.save(commTime);
    }

    private void require(boolean condition, String message) {
        if (!condition) {
            throw new IllegalArgumentException(message);
        }
    }
}
