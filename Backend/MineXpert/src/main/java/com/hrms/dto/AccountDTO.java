package com.hrms.dto;

import java.time.LocalDateTime;

import com.hrms.entity.Account;
import com.hrms.entity.Employee;

// LOT 41 P1 SECURITY: Bean Validation pour défense en profondeur sur le mot de passe.
// La règle métier est aussi enforced côté service (LOT 40), mais valider au niveau DTO
// stoppe les payloads non conformes avant qu'ils n'atteignent la couche service.
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    // LOT 41 P1 SECURITY: Bean Validation défense en profondeur sur le mot de passe.
    // - @Size et @Pattern sont null-tolérants (les payloads sans password — ex. updateAccount
    //   sans changement de mot de passe — passent toujours).
    // - Pour un password non null : min 10 caractères + au moins 1 majuscule, 1 minuscule,
    //   1 chiffre, 1 caractère spécial. Aligné sur la règle serveur LOT 40 (AccountServiceImpl).
    // - Le hash bcrypt commence par "$2a$"/"$2b$"/"$2y$" (60 chars) et matche également ce regex,
    //   donc les flux qui réinjectent un hash existant (cas legacy) ne sont pas cassés.
    @Size(min = 10, message = "PASSWORD_TOO_SHORT")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$",
             message = "PASSWORD_TOO_WEAK")
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

    /**
     * LOT 39 — ancien mot de passe.
     * Utilisé exclusivement par le parcours self-service de changement de mot
     * de passe (POST /account/update-password). Jamais persisté côté entité.
     * Placé en dernier pour préserver l'ordre positionnel du constructeur
     * @AllArgsConstructor utilisé par Account.toDTO().
     */
    private String oldPassword;

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
                this.status,
                // LOT 52 — champs identité non exposés par le DTO : valeurs par
                // défaut sûres (source locale, pas d'invitation en cours).
                "LOCAL",
                null);
    }
}
