package com.hrms.service.Timesheet;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.DataInterface.TimesheetDetails;
import com.hrms.dto.Status;
import com.hrms.entity.Holiday;
import com.hrms.entity.Timesheet.Team;
import com.hrms.entity.Timesheet.Timesheet;
import com.hrms.enums.Rotations;
import com.hrms.enums.TimesheetStatus;
import com.hrms.exception.HRMSException;
import com.hrms.repository.HolidayRepository;
import com.hrms.repository.Timesheet.ConstraintsRepository;
import com.hrms.repository.Timesheet.PayrollScheduleRepository;
import com.hrms.repository.Timesheet.TeamRepository;
import com.hrms.repository.Timesheet.TimesheetRepository;

@Service
public class TimesheetServiceImpl implements TimesheetService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TimesheetRepository timesheetRepository;

    @Autowired
    private MemberEntryService memberEntryService;

    @Autowired
    private HolidayRepository holidayRepository;

    @Autowired
    private ConstraintsService constraintsService;

    @Autowired
    private PayrollScheduleRepository payrollScheduleRepository;

    @Override
    public void generateTimesheet(Long id) throws HRMSException {
        Team team = teamRepository.findById(id).orElseThrow(() -> new HRMSException("TEAM_NOT_FOUND"));
        if (team.getNextWeekStartDate() == null || team.getNextWeekStartDate().isAfter(LocalDate.now())) {
            throw new HRMSException("TIMESHEET_ALREADY_CREATED");
        }
        Timesheet timesheet = new Timesheet();
        timesheet.setTeam(team);
        timesheet.setStartDate(team.getNextWeekStartDate());
        timesheet.setEndDate(team.getNextWeekStartDate().plusDays(6));
        timesheet.setStatus(TimesheetStatus.DRAFT);
        Long timesheetId = timesheetRepository.save(timesheet).getId();
        for (int i = 0; i < 7; i++) {
            final int dayIndex = i;
            boolean working = getWorking(team);
            boolean isHoliday = holidayRepository.findHolidayByDate(timesheet.getStartDate().plusDays(dayIndex))
                    .isPresent();
            team.getTeamMembers().parallelStream().filter(x -> x.getStatus() == Status.ACTIVE).forEach(teamMember -> {
                try {
                    memberEntryService.createMemberEntry(timesheetId, teamMember.getId(),
                            teamMember.getEmployee().getId(),
                            timesheet.getStartDate().plusDays(dayIndex), working, team.getWorkingHours(), isHoliday,
                            teamMember.getShift());
                } catch (HRMSException e) {

                }
            });
        }
        team.setNextWeekStartDate(team.getNextWeekStartDate().plusDays(7));
        teamRepository.save(team);

    }

    public boolean getWorking(Team team) {
        boolean working = true;
        Rotations rotation = team.getRotation();
        if (team.getRemainingWorkingDays() > 0) {
            working = true;
            team.setRemainingWorkingDays(team.getRemainingWorkingDays() - 1);
        } else if (team.getRemainingRestDays() > 0) {
            working = false;
            team.setRemainingRestDays(team.getRemainingRestDays() - 1);
        } else {
            if (rotation.equals(Rotations.FIVE_TWO)) {
                team.setRemainingWorkingDays(4);
                team.setRemainingRestDays(2);
            } else if (rotation.equals(Rotations.FOURTEEN_SEVEN)) {
                team.setRemainingWorkingDays(13);
                team.setRemainingRestDays(7);
            } else if (rotation.equals(Rotations.TWENTY_EIGHT_FOURTEEN)) {
                team.setRemainingWorkingDays(27);
                team.setRemainingRestDays(14);
            }
            working = true;
        }
        return working;
    }

    @Override
    public TimesheetDetails getLatestTimesheet(Long teamId) throws HRMSException {
        return timesheetRepository.getLatestTimesheet(teamId)
                .orElseThrow(() -> new HRMSException("TIMESHEET_NOT_FOUND"));

    }

    @Override
    public List<TimesheetDetails> getAllTimesheetDetails(Long teamId) throws HRMSException {
        return timesheetRepository.getAllTimesheetDetails(teamId);
    }

    @Override
    public TimesheetDetails getTimesheet(Long id) throws HRMSException {
        return timesheetRepository.getTimesheet(id).orElseThrow(() -> new HRMSException("TIMESHEET_NOT_FOUND"));
    }

    @Override
    public void updateTimesheetStatus(Long id, TimesheetStatus status) throws HRMSException {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new HRMSException("TIMESHEET_NOT_FOUND"));
        timesheet.setStatus(status);
        timesheetRepository.save(timesheet);
    }

    @Override
    public List<TimesheetDetails> getTimesheetDetailsByDepartmentAndMonth(Long departmentId, LocalDate date)
            throws HRMSException {
        return timesheetRepository.findByDepartmentIdAndMonth(departmentId, date);
    }

    @Override
    public List<TimesheetDetails> getTimesheetDetailsByCompanyAndMonth(Long companyId, LocalDate date)
            throws HRMSException {
        return timesheetRepository.findByCompanyIdAndMonth(companyId, date);
    }

    @Override
    public Object getAllTimesheetsByDepartment(Long departmentId) {
        return timesheetRepository.findTimesheetsByDepartment(departmentId);
    }

    @Override
    public Object getAllTimesheetsByCompany(Long companyId) {
        return timesheetRepository.findTimesheetsByCompany(companyId);
    }

    @Override
    public List<TimesheetDetails> getApprovedTimesheets() {
        return timesheetRepository.findApprovedTimesheets();
    }

    @Override
    public List<TimesheetDetails> getTimesheetsForApprover() throws HRMSException {
        List<TimesheetDetails> timesheets = timesheetRepository.findValidatedTimesheets();
        if (constraintsService.isFlagActive("VALIDATE_TIMESHEET_END_MONTH")) {
            Object obj = payrollScheduleRepository.findMonthEnd(LocalDate.now());
            if (obj != null) {
                LocalDate monthEnd = (LocalDate) obj;
                List<TimesheetDetails> timesheetsToBeValidated = timesheetRepository.findFlaggedTimesheets(monthEnd);
                timesheets.addAll(timesheetsToBeValidated);
            }
        }
        return timesheets;
    }

    @Override
    public void payTimesheets(List<Long> timesheetIds) throws HRMSException {
        List<Timesheet> timesheets = (List<Timesheet>) timesheetRepository.findAllById(timesheetIds);
        if (timesheets.isEmpty()) {
            throw new HRMSException("TIMESHEET_NOT_FOUND");
        }
        for (Timesheet timesheet : timesheets) {
            if (timesheet.getStatus() != TimesheetStatus.APPROVED) {
                throw new HRMSException("TIMESHEET_NOT_APPROVED");
            }
            timesheet.setStatus(TimesheetStatus.PAID);
        }
        timesheetRepository.saveAll(timesheets);
    }

}
