package com.hrms.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.hrms.dto.AccountDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @OneToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "emp_id", referencedColumnName = "id", nullable = true)
    private Employee employee;
    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;
    @ManyToOne
    @JoinColumn(name = "position_id")
    private Position position;
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    private String login;
    private String email;
    private String phoneNumber;
    private String role;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
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

    // timesheets
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

    /**
     * LOT 52 — source d'identité du compte :
     *   LOCAL            : identifiants créés dans SafeX (mot de passe bcrypt local)
     *   ACTIVE_DIRECTORY : compte importé de l'annuaire, authentification déléguée
     *                      (bind LDAP), aucun mot de passe local utilisable.
     */
    private String identitySource;

    /**
     * LOT 52 — expiration de l'invitation : tant que firstLogin est vrai, le mot
     * de passe temporaire n'est valable que jusqu'à cette date (72 h). Au-delà,
     * la connexion est refusée avec INVITATION_EXPIRED et l'admin doit renvoyer
     * une invitation. Null pour les comptes AD et les comptes déjà activés.
     */
    private LocalDateTime invitationExpiresAt;

    public AccountDTO toDTO() {
        return new AccountDTO(
                this.id,
                this.name,
                this.employee,
                this.company != null ? this.company.toDTO() : null,
                this.position != null ? this.position.toDTO() : null,
                this.department != null ? this.department.toDTO() : null,
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
                this.status,
                null /* oldPassword — jamais persisté, présent uniquement pour update-password */);
    }

}
