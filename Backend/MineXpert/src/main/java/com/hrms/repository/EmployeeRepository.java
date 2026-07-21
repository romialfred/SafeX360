package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.hrms.DataInterface.CategoryCount;
import com.hrms.DataInterface.EmpEmailPosResponse;
import com.hrms.DataInterface.EmployeeDetailsDTO;
import com.hrms.DataInterface.EmployeeDirection;
import com.hrms.DataInterface.EmployeeEmailDTO;
import com.hrms.DataInterface.EmployeeLeaveBalance;
import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.PromotionDetailsDTO;
import com.hrms.entity.Employee;

public interface EmployeeRepository extends CrudRepository<Employee, Long> {
    // @Query("SELECT e FROM Employee e WHERE (e.endDate IS NULL OR e.endDate >
    // CURRENT_DATE) " +
    // "AND e.login IS NOT NULL AND e.login <> '' " +
    // "AND e.professionalEmail IS NOT NULL AND e.professionalEmail <> '' " +
    // "AND e.position IS NOT NULL " +
    // "AND e.department IS NOT NULL " +
    // "AND e.professionalPhone IS NOT NULL AND e.professionalPhone <> ''")
    // List<Employee> findQualifiedEmployees();
    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.company.id AS compId, e.uniqueNumber AS empNumber "
            +
            "FROM Employee e " +
            "WHERE (e.endDate IS NULL OR e.endDate > CURRENT_DATE) " +
            "AND e.login IS NOT NULL AND e.login <> '' " +
            "AND e.professionalEmail IS NOT NULL AND e.professionalEmail <> '' " +
            "AND e.position IS NOT NULL " +
            "AND e.department IS NOT NULL " +
            "AND e.professionalPhone IS NOT NULL AND e.professionalPhone <> '' " +
            "AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) ")
    List<EmployeeNameDTO> findQualifiedEmployeeNames();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.department.name AS department,  e.professionalEmail AS email, e.department.direction as direction FROM Employee e WHERE e.id in ?1 and (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) ")
    List<EmployeeDirection> findEmployeeWithDirection(List<Long> ids);

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.department.name AS department,  e.professionalEmail AS email, e.department.direction as direction FROM Employee e WHERE (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) ")
    List<EmployeeDirection> findAllEmployeeWithDirection();

    @Query("SELECT a.company.name, COUNT(a) FROM Employee a GROUP BY a.company.name")
    List<Object[]> countEmployeesByCompany();

    @Query("SELECT a.gender, COUNT(a) FROM Employee a GROUP BY a.gender")
    List<Object[]> countEmployeesByGender();

    @Query("SELECT e.company.name, e.gender, COUNT(e) FROM Employee e GROUP BY e.company.name, e.gender ORDER BY e.company.name")
    List<Object[]> countEmployeesByCompanyAndGender();

    @Query("SELECT a.department.name, COUNT(a) FROM Employee a GROUP BY a.department.name")
    List<Object[]> countEmployeesByDepartment();

    @Query("SELECT a.positionCategory, COUNT(a) FROM Employee a GROUP BY a.positionCategory")
    List<Object[]> countEmployeesByCategory();

    @Query("SELECT a.contractType, COUNT(a) FROM Employee a GROUP BY a.contractType")
    List<Object[]> countEmployeesByContractType();

    @Query("SELECT e.id AS id, e.firstName as firstName, e.familyName AS familyName, e.department.name AS department FROM Employee e WHERE e.status IS NULL AND e.uniqueNumber = :uniqueNumber")
    Optional<EmployeeLeaveBalance> findByUniqueNumber(String uniqueNumber);

    Optional<Employee> findByLogin(String login);

    @Query(value = "SELECT CASE WHEN e.start_date IS NULL THEN 'Unknown' WHEN YEAR(CURRENT_DATE) - YEAR(e.start_date) > 15 THEN 'More than 15 years' WHEN YEAR(CURRENT_DATE) - YEAR(e.start_date) BETWEEN 5 AND 15 THEN '15 to 5 years' WHEN YEAR(CURRENT_DATE) - YEAR(e.start_date) BETWEEN 3 AND 5 THEN '5 to 3 years' WHEN YEAR(CURRENT_DATE) - YEAR(e.start_date) < 3 THEN 'Less than 3 years' END AS experienceGroup, COUNT(e.id) AS employeeCount FROM Employee e GROUP BY experienceGroup", nativeQuery = true)
    List<Object[]> getEmployeeExperienceGroups();

    @Query("SELECT COUNT(e.id) FROM Employee e WHERE e.department.id = :departmentId")
    Long countEmployeesInDepartment(@Param("departmentId") Long departmentId);

    List<Employee> findAllByDepartment_Id(Long departmentId);

    List<Employee> findByDepartment_NameIgnoreCaseContainingAndCompany_Id(String departmentName, Long companyId);
    // @Query("SELECT new com.hrms.dto.EmployeePromotionDTO(e.id, e.firstName,
    // e.familyName, e.promotions) FROM Employee e")
    // List<EmployeePromotionDTO> findAllEmployeePromotions();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber as empNumber FROM Employee e WHERE e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE ")
    List<EmployeeNameDTO> findEmployeeNames();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber as empNumber, e.professionalEmail as email FROM Employee e WHERE e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE ")
    List<EmployeeNameDTO> findEmployeeNamesWithEmail();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.professionalEmail as email, e.position.id as positionId, e.position.name as position, e.department.name as department FROM Employee e WHERE e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE ")
    List<EmpEmailPosResponse> findEmployeeNamesWithEmailAndPosition();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.department.id as departmentId, e.department.name as department, e.uniqueNumber as empNumber FROM Employee e WHERE e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE")
    List<EmpEmailPosResponse> findEmployeeNamesWithDepartment();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.professionalEmail as email, e.position.id as positionId, e.position.name as position, e.department.name as department FROM Employee e WHERE (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE)  AND e.id = :id ")
    Optional<EmpEmailPosResponse> findEmployeeNamesWithEmailAndPositionById(Long id);

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name " +
            "FROM Employee e " +
            "WHERE LOWER(e.department.name) LIKE LOWER(CONCAT('%', :departmentName, '%')) " +
            "AND e.company.id = :companyId AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) ")
    List<EmployeeNameDTO> findEmployeeNamesByDepartmentAndCompany(@Param("departmentName") String departmentName,
            @Param("companyId") Long companyId);

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber AS empNumber " +
            "FROM Employee e " +
            "WHERE e.department.id = :departmentId AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) ")
    List<EmployeeNameDTO> findEmployeeNamesByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber AS empNumber " +
            "FROM Employee e " +
            "WHERE e.company.id = :companyId AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) ")
    List<EmployeeNameDTO> findEmployeeNamesByCompanyId(@Param("companyId") Long companyId);

    @Query("""
                SELECT e.id AS id,
                       e.uniqueNumber AS uniqueNumber,
                       CONCAT(e.firstName, ' ', e.familyName) AS name,
                       c.name AS company,
                       c.id AS companyId,
                       e.gender AS gender,
                       d.name AS department,
                       p.name AS position,
                       e.startDate AS startDate,
                       e.contractType AS contractType,
                       e.nationality AS nationality,
                       e.status AS status
                FROM Employee e
                LEFT JOIN e.company c
                LEFT JOIN e.department d
                LEFT JOIN e.position p

            """)
    List<EmployeeDetailsDTO> findAllEmployeeDetails();

    @Query("""
                SELECT
                    e.department.sector AS sector,
                    e.gender AS gender,
                    COUNT(e.id) AS totalCount
                FROM Employee e
                GROUP BY e.department.sector, e.gender
            """)
    List<Object[]> getSectorGenderCounts();

    @Query("SELECT e.id AS id, " +
            "CONCAT(e.firstName, ' ', e.familyName) AS name, " +
            "p.prevCompany.id AS prevCompanyId, " +
            "p.prevCompany.name AS prevCompany, " +
            "p.company.name AS company, " +
            "p.prevPosition.name AS prevPosition, " +
            "p.position.name AS position, " +
            "p.department.name AS department, " +
            "p.prevDepartment.name AS prevDepartment, " +
            "p.startDate AS startDate " +
            "FROM Employee e " +
            "JOIN e.promotions p " +
            "JOIN p.prevCompany prevC " +
            "JOIN p.company currC " +
            "JOIN p.department currD " +
            "JOIN p.prevDepartment prevD " +
            "JOIN p.prevPosition prevPos " +
            "JOIN p.position currPos")
    List<PromotionDetailsDTO> findAllPromotions();

    @Query("SELECT e.id as id, CONCAT(e.firstName, ' ', e.familyName) AS name, d.name as department, p.name as position, e.profilePicture AS profilePicture, e.company.name as company   "
            +
            "FROM Employee e " +
            "JOIN e.department d " +
            "JOIN e.position p " +
            "WHERE e.company.id = :companyId AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) "
            +
            "ORDER BY e.startDate DESC LIMIT 10")
    List<EmployeeDetailsDTO> findLast10EmployeesByCompany(@Param("companyId") Long companyId);

    @Query("SELECT s.basicSalary, s.extraPay, s.expatriationAllowance, s.housingAllowance, "
            + "s.responsibilityAllowance, s.rosterAllowance, s.smearAllowance, s.onCallAllowance, "
            + "s.exceptionalAllowance, s.transportAllowance, s.cashHandlingAllowance, s.clothingAllowance, "
            + "s.individualPerformance, s.performanceRate, s.surcharge, s.sujetionAllowance, "
            + "s.primeERT, s.riskAllowance, s.vacation, s.securityAllowance "
            + "FROM Employee s WHERE s.id = :employeeId")
    List<Object[]> getSalaryFields(Long employeeId);

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber AS empNumber " +
            "FROM Employee e " +
            "WHERE e.department.id = :departmentId " +
            "AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) " +
            "AND e.id NOT IN :excludedEmployeeIds")
    List<EmployeeNameDTO> findEmployeeNamesByDepartmentIdAndNotInAnyTeam(
            @Param("departmentId") Long departmentId,
            @Param("excludedEmployeeIds") List<Long> excludedEmployeeIds);

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber AS empNumber " +
            "FROM Employee e " +
            "WHERE e.company.id = :companyId " +
            "AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE) " +
            "AND e.id NOT IN :excludedEmployeeIds")
    List<EmployeeNameDTO> findEmployeeNamesByCompanyIdAndNotInAnyTeam(
            @Param("companyId") Long companyId,
            @Param("excludedEmployeeIds") List<Long> excludedEmployeeIds);

    @Query("Select count(*) from Employee e")
    Long getCount();

    @Query("SELECT e.contractCategory AS category, COUNT(e) AS count FROM Employee e GROUP BY e.contractCategory")
    List<CategoryCount> countEmployeesByContract();

    @Query("SELECT e.id AS id, CONCAT(e.firstName, ' ', e.familyName) AS name, e.uniqueNumber AS empNumber, e.phoneNumber AS phone " +
            "FROM Employee e " +
            "WHERE e.id IN :employees " +
            "AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE)")
    List<EmployeeNameDTO> findEmployeesByIds(@Param("employees") List<Long> employees);

    @Query("SELECT e.id AS id, e.professionalEmail AS email "
            + "FROM Employee e "
            + "WHERE e.id IN :employeeIds "
            + "AND e.professionalEmail IS NOT NULL "
            + "AND e.professionalEmail <> '' "
            + "AND (e.effectiveEndDate IS NULL OR e.effectiveEndDate > CURRENT_DATE)")
    List<EmployeeEmailDTO> findEmployeeEmailsByIds(@Param("employeeIds") List<Long> employeeIds);

}
