package com.hrms.DataInterface;

import java.time.LocalDate;

public interface PromotionDetailsDTO {
    Long getId();
    String getName();
    Long getPrevCompanyId();
    String getPrevCompany();
    String getCompany();
    String getPrevDepartment();
    String getDepartment();
    String getPrevPosition();
    String getPosition();
    LocalDate getStartDate(); 
}
