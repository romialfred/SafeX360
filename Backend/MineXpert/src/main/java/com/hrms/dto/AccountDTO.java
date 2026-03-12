package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.Account;
import com.hrms.entity.Employee;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountDTO {
    private Long id;
    private String name;
    private Employee employee;
    private CompanyDTO company;
    private PositionDTO position;
    private DepartmentDTO department;
    private String login;
    private String email;
    private String phoneNumber;
    private String role;
    private String password;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String employeePermission;
    private String leaveSettings;
    private String leavesManagement;
    private String leavesRequest;
    private String holidays;
    private String rosterPermission;
    private String companyPermission;
    private String departmentPermission;
    private String headcountDashboard;
    private String leaveBalance;
    private String jobPositions;
    private String jobPositionCategories;
    private String userAccountsAndRoles;
    private String positionManagement;
    private String contractManagement;
    private String advanceRequest;
    private String advanceManagement;

    private String teams;
    private String myTimesheet;
    private String teamTimesheet;
    private String timesheetManagement;
    private String timesheetVerification;
    private String timesheetApproval;
    private String timesheetTransfer;
    private String payrollHistory;
    private String payrollSchedule;
    private String rulesConstraints;
    private String workHourCodes;
    private String timesheetPermissions;

    private Boolean firstLogin;
    private String status;

    public Account toEntity() {
        return new Account(
                this.id,
                this.name,
                this.employee,
                this.company != null ? this.company.toEntity() : null,
                this.position != null ? this.position.toEntity() : null,
                this.department != null ? this.department.toEntity() : null,
                this.login,
                this.email,
                this.phoneNumber,
                this.role,
                this.password,
                this.startDate,
                this.endDate,
                this.employeePermission,
                this.leaveSettings,
                this.leavesManagement,
                this.leavesRequest,
                this.holidays,
                this.rosterPermission,
                this.companyPermission,
                this.departmentPermission,
                this.headcountDashboard,
                this.leaveBalance,
                this.jobPositions,
                this.jobPositionCategories,
                this.userAccountsAndRoles,
                this.positionManagement,
                this.contractManagement,
                this.advanceRequest,
                this.advanceManagement,
                this.teams,
                this.myTimesheet,
                this.teamTimesheet,
                this.timesheetManagement,
                this.timesheetVerification,
                this.timesheetApproval,
                this.timesheetTransfer,
                this.payrollHistory,
                this.payrollSchedule,
                this.rulesConstraints,
                this.workHourCodes,
                this.timesheetPermissions,
                this.firstLogin,
                this.status);
    }
}
