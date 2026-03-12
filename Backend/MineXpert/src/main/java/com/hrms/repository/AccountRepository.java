package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.DataInterface.AccountDetailsDTO;
import com.hrms.DataInterface.AccountNameDTO;
import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.entity.Account;

public interface AccountRepository extends CrudRepository<Account, Long> {
        Optional<Account> findByLogin(String Login);

        Optional<Account> findByEmailAndLogin(String email, String login);

        Optional<Account> findByEmployee_Id(Long employeeId);

        @Query("SELECT a.company.name, COUNT(a) FROM Account a GROUP BY a.company.name")
        List<Object[]> countAccountsByCompany();

        @Query("SELECT a.company.name, COUNT(a) FROM Account a where a.status='ACTIVE' GROUP BY a.company.name")
        List<Object[]> countActiveAccountsByCompany();

        @Query("SELECT a.company.name, COUNT(a) FROM Account a where a.role='Administrator' GROUP BY a.company.name")
        List<Object[]> countAdminAccountsByCompany();

        @Query("SELECT a.employee.id FROM Account a WHERE a.employee IS NOT NULL")
        List<Long> findAllEmpIds();

        @Query("SELECT a FROM Account a WHERE a.department.id = :departmentId " +
                        "AND a.leavesManagement LIKE '11%'")
        List<Account> findAccountsByDepartmentAndLeavesManagement(@Param("departmentId") Long departmentId);

        @Query("SELECT a.id AS id,a.employee.id AS empId, a.name AS name " +
                        "FROM Account a " +
                        "WHERE a.department.id = :departmentId " +
                        "AND a.leavesManagement LIKE '11%' AND a.employee.status IS NULL")
        List<AccountNameDTO> findAccountNamesByDepartment(@Param("departmentId") Long departmentId);

        @Query("SELECT e.id AS id, emp.id AS empId, e.name AS name, e.role AS role, c.id AS companyId, c.name AS company, e.email AS email, e.login AS login, e.firstLogin AS firstLogin, e.startDate AS startDate, e.endDate AS endDate, e.employeePermission AS employeePermission, e.leaveSettings AS leaveSettings, e.leavesManagement AS leavesManagement, e.leavesRequest AS leavesRequest, e.holidays AS holidays, e.rosterPermission AS rosterPermission, e.companyPermission AS companyPermission, e.departmentPermission AS departmentPermission, e.headcountDashboard AS headcountDashboard, e.leaveBalance AS leaveBalance, e.jobPositions AS jobPositions, e.jobPositionCategories AS jobPositionCategories, e.userAccountsAndRoles AS userAccountsAndRoles, e.positionManagement AS positionManagement, e.contractManagement AS contractManagement, e.advanceRequest as advanceRequest, e.advanceManagement as advanceManagement FROM Account e   LEFT JOIN e.company c LEFT JOIN e.employee emp")
        List<AccountDetailsDTO> getAllAccounts();

        @Query("SELECT e.id AS id, e.name AS name, " +
                        "e.employeePermission AS employeePermission, e.leaveSettings AS leaveSettings, " +
                        "e.leavesManagement AS leavesManagement, e.leavesRequest AS leavesRequest, " +
                        "e.holidays AS holidays, e.rosterPermission AS rosterPermission, " +
                        "e.companyPermission AS companyPermission, e.departmentPermission AS departmentPermission, " +
                        "e.headcountDashboard AS headcountDashboard, e.leaveBalance AS leaveBalance, " +
                        "e.jobPositions AS jobPositions, e.jobPositionCategories AS jobPositionCategories, " +
                        "e.userAccountsAndRoles AS userAccountsAndRoles, e.positionManagement AS positionManagement, " +
                        "e.contractManagement AS contractManagement, e.advanceRequest AS advanceRequest, " +
                        "e.advanceManagement AS advanceManagement, " +
                        "e.teams AS teams, e.myTimesheet AS myTimesheet, " +
                        "e.teamTimesheet AS teamTimesheet, e.timesheetManagement AS timesheetManagement, " +
                        "e.timesheetVerification AS timesheetVerification, " +
                        "e.timesheetApproval AS timesheetApproval, e.timesheetTransfer AS timesheetTransfer, " +
                        "e.payrollHistory AS payrollHistory, e.payrollSchedule AS payrollSchedule, " +
                        "e.rulesConstraints AS rulesConstraints, " +
                        "e.workHourCodes AS workHourCodes, " +
                        "e.timesheetPermissions AS timesheetPermissions " +
                        "FROM Account e WHERE e.id = :id")
        Optional<AccountDetailsDTO> getAccountPermission(@Param("id") Long id);

        // @Query("SELECT a FROM Account a WHERE (a.company.id = :companyId OR a.company
        // IS NULL) " +
        // "AND a.advanceManagement LIKE '11%'")
        @Query("SELECT a.id AS id,a.employee.id AS empId, a.name AS name " +
                        "FROM Account a " +
                        "WHERE (a.company.id = :companyId OR a.company IS NULL) " +
                        "AND a.advanceManagement LIKE '11%' AND a.employee.status IS NULL")
        List<AccountNameDTO> findAccountsByCompanyAndLAdvanceManagement(@Param("companyId") Long companyId);

}
