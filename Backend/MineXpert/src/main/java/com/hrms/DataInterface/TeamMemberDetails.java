package com.hrms.DataInterface;

import com.hrms.enums.Shifts;

public interface TeamMemberDetails {
    public Long getId();

    public String getName();

    public Shifts getShift();

    public String getStatus();
}
