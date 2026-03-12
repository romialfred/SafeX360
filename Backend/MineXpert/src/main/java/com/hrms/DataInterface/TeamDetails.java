package com.hrms.DataInterface;

import java.time.LocalDate;

import com.hrms.enums.Rotations;
import com.hrms.enums.TeamStatus;
import com.hrms.enums.TeamType;

public interface TeamDetails {
    Long getId();

    String getName();

    String getDepartment();

    Long getDepartmentId();

    String getCompany();

    Long getCompanyId();

    String getShortName();

    String getWeekStartDay();

    Integer getWorkingHours();

    Integer getMaxWorkingHours();

    String getColor();

    String getDescription();

    LocalDate getNextWeekStartDate();

    Integer getMemberCount();

    Rotations getRotation();

    TeamStatus getStatus();

    TeamType getType();
}
