package com.hrms.DataInterface;

import com.hrms.enums.Role;

public interface TeamManagerDetails {
    public Long getId();

    public String getName();

    public Role getRole();

    public String getStatus();

    public String getEmail();
}
