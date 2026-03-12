package com.hrms.DataInterface;

import com.hrms.enums.Role;
import com.hrms.enums.TeamType;

public interface TeamRoleDetails {
    public Long getId();

    public String getName();

    public Role getRole();

    public String getDepartment();

    public TeamType getType();

}
