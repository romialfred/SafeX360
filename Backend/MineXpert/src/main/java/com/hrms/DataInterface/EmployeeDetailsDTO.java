package com.hrms.DataInterface;

import java.time.LocalDate;

public interface EmployeeDetailsDTO {
    Long getId();
    String getUniqueNumber();
    String getName();
    String getCompany();
    Long getCompanyId();
    String getGender();
    String getDepartment();
    String getPosition();
    LocalDate getStartDate();
    String getContractType();
    String getNationality();
    String getStatus();
    String getProfilePicture();
}
