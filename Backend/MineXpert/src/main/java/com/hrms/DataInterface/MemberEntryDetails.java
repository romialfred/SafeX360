package com.hrms.DataInterface;

import java.time.LocalDate;

import com.hrms.enums.EntryStatus;
import com.hrms.enums.EntryType;
import com.hrms.enums.Shifts;

public interface MemberEntryDetails {
    public Long getId();

    public String getName();

    public String getRole();

    public String getAttendance();

    public LocalDate getDate();

    public Long getEmpId();

    public Long getMemberId();

    public String getEmpNumber();

    public Boolean getCommented();

    public Shifts getShift();

    public EntryStatus getStatus();

    public EntryType getType();

    public String getTeamName();

    public Long getTeamId();
}
