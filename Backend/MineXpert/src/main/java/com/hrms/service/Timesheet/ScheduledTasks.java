package com.hrms.service.Timesheet;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.enums.TeamStatus;
import com.hrms.exception.HRMSException;
import com.hrms.repository.Timesheet.TeamRepository;

@Service
public class ScheduledTasks {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TimesheetService timesheetService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    @Scheduled(cron = "0 0 0 * * *")
    public void generateAllTimesheets() {

        teamRepository.findAllTeamIds(TeamStatus.ACTIVE).parallelStream().forEach(teamId -> {
            try {
                timesheetService.generateTimesheet(teamId);
            } catch (HRMSException e) {
            }
        });
    }

}
