package com.hrms.DataInterface;

import java.time.LocalDate;
import java.util.List;

import com.hrms.enums.TeamType;
import com.hrms.enums.TimesheetStatus;

public interface TimesheetDetails {
    public Long getId();

    public String getTeamName();

    public Long getTeamId();

    public String getDepartment();

    public LocalDate getStartDate();

    public LocalDate getEndDate();

    public TimesheetStatus getStatus();

    public List<MemberEntryDetails> getMemberEntries();

    public TeamType getTeamType();
}
