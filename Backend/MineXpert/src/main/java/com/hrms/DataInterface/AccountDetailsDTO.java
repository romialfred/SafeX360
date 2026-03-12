package com.hrms.DataInterface;

import java.time.LocalDateTime;

public interface AccountDetailsDTO {
    Long getId();

    Long getEmpId();

    String getName();

    String getRole();

    Long getCompanyId();

    String getCompany();

    String getEmail();

    String getLogin();

    Boolean getFirstLogin();

    LocalDateTime getStartDate();

    LocalDateTime getEndDate();

    String getEmployeePermission();

    String getLeaveSettings();

    String getLeavesManagement();

    String getLeavesRequest();

    String getHolidays();

    String getRosterPermission();

    String getCompanyPermission();

    String getDepartmentPermission();

    String getHeadcountDashboard();

    String getLeaveBalance();

    String getJobPositions();

    String getJobPositionCategories();

    String getUserAccountsAndRoles();

    String getPositionManagement();

    String getContractManagement();

    String getAdvanceRequest();

    String getAdvanceManagement();

    String getTeams();

    String getMyTimesheet();

    String getTeamTimesheet();

    String getTimesheetManagement();

    String getWorkHourCodes();

    String getTimesheetVerification();

    String getTimesheetApproval();

    String getTimesheetTransfer();

    String getPayrollHistory();

    String getPayrollSchedule();

    String getRulesConstraints();

    String getTimesheetPermissions();

}
