package com.hrms.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.hrms.DataInterface.CategoryCount;
import com.hrms.DataInterface.EmpEmailPosResponse;
import com.hrms.DataInterface.EmployeeDetailsDTO;
import com.hrms.DataInterface.EmployeeDirection;
import com.hrms.DataInterface.EmployeeEmailDTO;
import com.hrms.DataInterface.EmployeeLeaveBalance;
import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.PromotionDetailsDTO;
import com.hrms.dto.DocumentsDTO;
import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.Documents;
import com.hrms.entity.Employee;
import com.hrms.entity.Promotion;
import com.hrms.exception.HRMSException;
import com.hrms.repository.EmployeeRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * LOT 40 P1 fix : UPLOAD_DIR externalisé via configuration.
     *
     * Avant : chemin Windows hardcodé ("M:/hrmsDocs/") qui :
     *   - cassait sur Linux (Render)
     *   - bloquait les déploiements multi-environnement
     *   - mélangeait config et code
     *
     * Désormais lu depuis la propriété `app.upload-dir` (application.yml),
     * elle-même injectable via la variable d'environnement UPLOAD_DIR.
     * Valeur par défaut : "./uploads" (relatif au working dir, portable).
     */
    @org.springframework.beans.factory.annotation.Value("${app.upload-dir:./uploads/}")
    private String UPLOAD_DIR;

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "employeeById", allEntries = true),
            @CacheEvict(cacheNames = "employeesAll", allEntries = true),
            @CacheEvict(cacheNames = "employeesQualified", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByDepartment", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByGender", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByCompanyGender", allEntries = true),
            @CacheEvict(cacheNames = "employeeByUniqueNumber", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsBySeniority", allEntries = true),
            @CacheEvict(cacheNames = "employeeDepartmentCount", allEntries = true),
            @CacheEvict(cacheNames = "employeeNamesByDepartment", allEntries = true),
            @CacheEvict(cacheNames = "employeeNamesByCompany", allEntries = true),
            @CacheEvict(cacheNames = "employeeDropdown", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByCategory", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByContractType", allEntries = true),
            @CacheEvict(cacheNames = "employeeSectorGenderCount", allEntries = true),
            @CacheEvict(cacheNames = "employeeLast10ByCompany", allEntries = true),
            @CacheEvict(cacheNames = "employeeContractCategories", allEntries = true),
            @CacheEvict(cacheNames = "employeesByIds", allEntries = true),
            @CacheEvict(cacheNames = "employeeEmailsByIds", allEntries = true),
            @CacheEvict(cacheNames = "employeeNamesWithEmail", allEntries = true),
            @CacheEvict(cacheNames = "employeeEmailPosition", allEntries = true),
            @CacheEvict(cacheNames = "employeeEmailPositionById", allEntries = true),
            @CacheEvict(cacheNames = "employeeWithDepartment", allEntries = true),
            @CacheEvict(cacheNames = "employeeDirectionByIds", allEntries = true),
            @CacheEvict(cacheNames = "employeeDirectionAll", allEntries = true),
            @CacheEvict(cacheNames = "employeeSalary", allEntries = true),
            @CacheEvict(cacheNames = "totalEmployeeCount", allEntries = true),
            @CacheEvict(cacheNames = "employeeDocuments", allEntries = true),
            @CacheEvict(cacheNames = "employeePromotions", allEntries = true)
    })
    public void addEmployee(EmployeeDTO employeeDTO) throws HRMSException {
        if (employeeRepository.findByUniqueNumber(employeeDTO.getUniqueNumber()).isPresent())
            throw new HRMSException("UNIQUE_NUMBER_EXISTS");
        if (employeeRepository.findByLogin(employeeDTO.getLogin()).isPresent())
            throw new HRMSException("LOGIN_ALREADY_EXISTS");
        employeeRepository.save(employeeDTO.toEntity());
    }

    @Override
    @Cacheable(cacheNames = "employeeById", key = "#id")
    public EmployeeDTO getEmployee(Long id) throws HRMSException {
        return employeeRepository.findById(id).orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND")).toDTO();
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "employeeById", key = "#employeeDTO.id", condition = "#employeeDTO.id != null"),
            @CacheEvict(cacheNames = "employeesAll", allEntries = true),
            @CacheEvict(cacheNames = "employeesQualified", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByCompany", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByDepartment", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByGender", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByCompanyGender", allEntries = true),
            @CacheEvict(cacheNames = "employeeByUniqueNumber", key = "#employeeDTO.uniqueNumber", condition = "#employeeDTO.uniqueNumber != null"),
            @CacheEvict(cacheNames = "employeeCountsBySeniority", allEntries = true),
            @CacheEvict(cacheNames = "employeeDepartmentCount", allEntries = true),
            @CacheEvict(cacheNames = "employeeNamesByDepartment", allEntries = true),
            @CacheEvict(cacheNames = "employeeNamesByCompany", allEntries = true),
            @CacheEvict(cacheNames = "employeeDropdown", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByCategory", allEntries = true),
            @CacheEvict(cacheNames = "employeeCountsByContractType", allEntries = true),
            @CacheEvict(cacheNames = "employeeSectorGenderCount", allEntries = true),
            @CacheEvict(cacheNames = "employeeLast10ByCompany", allEntries = true),
            @CacheEvict(cacheNames = "employeeContractCategories", allEntries = true),
            @CacheEvict(cacheNames = "employeesByIds", allEntries = true),
            @CacheEvict(cacheNames = "employeeEmailsByIds", allEntries = true),
            @CacheEvict(cacheNames = "employeeNamesWithEmail", allEntries = true),
            @CacheEvict(cacheNames = "employeeEmailPosition", allEntries = true),
            @CacheEvict(cacheNames = "employeeWithDepartment", allEntries = true),
            @CacheEvict(cacheNames = "employeeDirectionByIds", allEntries = true),
            @CacheEvict(cacheNames = "employeeDirectionAll", allEntries = true),
            @CacheEvict(cacheNames = "employeeSalary", key = "#employeeDTO.id", condition = "#employeeDTO.id != null"),
            @CacheEvict(cacheNames = "totalEmployeeCount", allEntries = true),
            @CacheEvict(cacheNames = "employeePromotions", allEntries = true)
    })
    public void updateEmployee(EmployeeDTO employeeDTO) throws HRMSException {
        employeeRepository.findById(employeeDTO.getId()).orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        Optional<EmployeeLeaveBalance> opt1 = employeeRepository.findByUniqueNumber(employeeDTO.getUniqueNumber());
        if (opt1.isPresent() && opt1.get().getId() != employeeDTO.getId())
            throw new HRMSException("UNIQUE_NUMBER_EXISTS");
        Optional<Employee> opt2 = employeeRepository.findByLogin(employeeDTO.getLogin());
        if (opt2.isPresent() && opt2.get().getId() != employeeDTO.getId())
            throw new HRMSException("LOGIN_ALREADY_EXISTS");

        employeeRepository.save(employeeDTO.toEntity());
    }

    @Override
    public void deleteEmployee(Long id) {
        throw new UnsupportedOperationException("Unimplemented method 'deleteEmployee'");
    }

    @Override
    @Cacheable(cacheNames = "employeesAll")
    public List<EmployeeDetailsDTO> getAllEmployees() {
        return ((List<EmployeeDetailsDTO>) employeeRepository.findAllEmployeeDetails());
    }

    @Override
    @Cacheable(cacheNames = "employeesQualified")
    public List<EmployeeNameDTO> getQualifiedEmployees() {
        return (List<EmployeeNameDTO>) employeeRepository.findQualifiedEmployeeNames();

    }

    @Override
    @Cacheable(cacheNames = "employeeCountsByCompany")
    public List<Object[]> getCountsByCompany() {
        return employeeRepository.countEmployeesByCompany();
    }

    @Override
    @Cacheable(cacheNames = "employeeCountsByDepartment")
    public List<Object[]> getCountsByDepartment() {
        return employeeRepository.countEmployeesByDepartment();
    }

    @Override
    @Cacheable(cacheNames = "employeeCountsByGender")
    public List<Object[]> getCountsByGender() {
        return employeeRepository.countEmployeesByGender();
    }

    @Override
    @Cacheable(cacheNames = "employeeCountsByCompanyGender")
    public List<Object[]> getCountsByCompanyAndGender() {
        return employeeRepository.countEmployeesByCompanyAndGender();
    }

    @Override
    @Cacheable(cacheNames = "employeeByUniqueNumber", key = "#uniqueNumber")
    public EmployeeLeaveBalance getEmployeeByUniqueNumber(String uniqueNumber) throws HRMSException {
        return employeeRepository.findByUniqueNumber(uniqueNumber)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = "employeeCountsBySeniority")
    public List<Object[]> getCountsBySeniority() {
        return employeeRepository.getEmployeeExperienceGroups();
    }

    @Override
    @Cacheable(cacheNames = "employeeDepartmentCount", key = "#departmentId")
    public Long getDepartmentCount(Long departmentId) {
        return employeeRepository.countEmployeesInDepartment(departmentId);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "employeeById", key = "#employeeId"),
            @CacheEvict(cacheNames = "employeesAll", allEntries = true)
    })
    public DocumentsDTO addDocument(Long employeeId, String name, MultipartFile file) throws Exception {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        Path filePath = saveFile(file);
        Documents document = new Documents(null, name, filePath.getFileName().toString(), "PDF");
        List<Documents> documents = employee.getDocuments();
        if (documents == null)
            documents = List.of(document);
        else
            documents.add(document);
        employee.setDocuments(documents);
        return employeeRepository.save(employee).getDocuments().stream()
                .filter(doc -> doc.getPath().equals(filePath.getFileName().toString())).findFirst().get().toDTO();
    }

    private Path saveFile(MultipartFile file) throws Exception {
        String hashFileName = generateFileHash(file.getOriginalFilename() + System.currentTimeMillis());
        Path path = Paths.get(UPLOAD_DIR + hashFileName);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());
        return path;
    }

    private String generateFileHash(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(input.getBytes());
        return HexFormat.of().formatHex(hash);
    }

    /**
     * LOT 40 P0 Security fix : path traversal protection.
     *
     * Audit a découvert que getDocument(String doc) et getProfilePicture(String doc)
     * concatenaient le filename utilisateur directement avec UPLOAD_DIR sans
     * validation, permettant `GET /hrms/employee/files/..%2F..%2F..%2Fetc%2Fpasswd`
     * pour lire des fichiers arbitraires.
     *
     * On valide désormais :
     *   1. Le filename ne contient pas `..`, `/`, `\`, ni byte null.
     *   2. Le path résolu reste dans UPLOAD_DIR (Files.isSameFile ou startsWith).
     */
    private Path validateAndResolveUploadPath(String userSuppliedFilename) throws HRMSException {
        if (userSuppliedFilename == null || userSuppliedFilename.isBlank()) {
            throw new HRMSException("INVALID_FILE");
        }
        // Reject obvious traversal attempts before resolution.
        if (userSuppliedFilename.contains("..")
                || userSuppliedFilename.contains("/")
                || userSuppliedFilename.contains("\\")
                || userSuppliedFilename.contains("\0")) {
            throw new HRMSException("INVALID_FILE");
        }
        try {
            Path base = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Path candidate = base.resolve(userSuppliedFilename).normalize();
            // Belt and suspenders : confirm the resolved path is under the base.
            if (!candidate.startsWith(base)) {
                throw new HRMSException("INVALID_FILE");
            }
            return candidate;
        } catch (Exception e) {
            throw new HRMSException("INVALID_FILE");
        }
    }

    @Override
    public Resource getDocument(String doc) throws Exception {
        Path path = validateAndResolveUploadPath(doc);
        if (Files.exists(path)) {
            Resource resource = new UrlResource(path.toUri());
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return resource;
        } else {
            throw new HRMSException("FILE_NOT_FOUND");
        }
    }

    @Override
    public Resource getProfilePicture(String doc) throws Exception {
        Path path = validateAndResolveUploadPath(doc);
        if (Files.exists(path)) {
            Resource resource = new UrlResource(path.toUri());
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return resource;
        } else {
            throw new HRMSException("FILE_NOT_FOUND");
        }
    }

    @Override
    @CacheEvict(cacheNames = "employeeById", key = "#employeeId")
    public void deleteDocument(Long id, Long employeeId) throws HRMSException {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        List<Documents> documents = employee.getDocuments();
        if (documents == null)
            throw new HRMSException("DOCUMENT_NOT_FOUND");
        documents.removeIf(doc -> doc.getId().equals(id));
        employee.setDocuments(documents);
        employeeRepository.save(employee);

    }

    @Override
    @CacheEvict(cacheNames = "employeeById", key = "#employeeId")
    public String updateProfilePicture(Long employeeId, MultipartFile file) throws Exception {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        Path filePath = saveFile(file);
        employee.setProfilePicture(filePath.getFileName().toString());
        employeeRepository.save(employee);
        return filePath.getFileName().toString();
    }

    @Override
    public String getPicture(Long employeeId) throws Exception {
        return employeeRepository.findById(employeeId).orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"))
                .getProfilePicture();
    }

    @Override
    @CacheEvict(cacheNames = "employeeById", key = "#employeeId")
    public void deletePicture(Long employeeId) throws HRMSException {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        employee.setProfilePicture(null);
        employeeRepository.save(employee);
    }

    @Override
    @Cacheable(cacheNames = "employeeNamesByDepartment", key = "#departmentId")
    public List<EmployeeNameDTO> getAllEmployeesByDepartment(Long departmentId) {
        return ((List<EmployeeNameDTO>) employeeRepository.findEmployeeNamesByDepartmentId(departmentId));
    }

    @Override
    @Cacheable(cacheNames = "employeeNamesByDepartment", key = "'hr:' + #companyId")
    public List<EmployeeNameDTO> getAllHRApproversByCompany(Long companyId) {
        return ((List<EmployeeNameDTO>) employeeRepository
                .findEmployeeNamesByDepartmentAndCompany("Human Resource", companyId));
    }

    @Override
    @Caching(evict = {
            @CacheEvict(cacheNames = "employeeById", key = "#employeeDTO.id", condition = "#employeeDTO.id != null"),
            @CacheEvict(cacheNames = "employeesAll", allEntries = true),
            @CacheEvict(cacheNames = "employeePromotions", allEntries = true)
    })
    public void promoteEmployee(EmployeeDTO employeeDTO, Long recommendedBy, Long approvedBy, String reason,
            LocalDate endDate) throws HRMSException {
        Employee employee = employeeRepository.findById(employeeDTO.getId())
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        Employee newEmployee = employeeDTO.toEntity();
        Promotion promotion = new Promotion(null, recommendedBy, approvedBy, reason, employee.getCompany(),
                employee.getDepartment(), employee.getService(), employee.getPosition(), employee.getGrade(),
                employee.getRoster(), employee.getPositionCategory(), employee.getStartDate(), endDate,
                newEmployee.getCompany(),
                newEmployee.getDepartment(), newEmployee.getService(), newEmployee.getPosition(),
                newEmployee.getGrade(), newEmployee.getPositionCategory(), newEmployee.getRoster(),
                newEmployee.getEchelon(), newEmployee.getContractCategory(), newEmployee.getContractType(),
                newEmployee.getStartDate(), newEmployee.getEndDate(), LocalDateTime.now());
        employee.setCompany(newEmployee.getCompany());
        employee.setDepartment(newEmployee.getDepartment());
        employee.setService(newEmployee.getService());
        employee.setPosition(newEmployee.getPosition());
        employee.setGrade(newEmployee.getGrade());
        employee.setPositionCategory(newEmployee.getPositionCategory());
        employee.setRoster(newEmployee.getRoster());
        employee.setEchelon(newEmployee.getEchelon());
        employee.setContractCategory(newEmployee.getContractCategory());
        employee.setContractType(newEmployee.getContractType());
        employee.setStartDate(newEmployee.getStartDate());
        employee.setEndDate(newEmployee.getEndDate());

        employee.setPaymentPeriod(newEmployee.getPaymentPeriod());
        employee.setSalaryCurrency(newEmployee.getSalaryCurrency());
        employee.setBasicSalary(newEmployee.getBasicSalary());
        employee.setExtraPay(newEmployee.getExtraPay());
        employee.setExpatriationAllowance(newEmployee.getExpatriationAllowance());
        employee.setHousingAllowance(newEmployee.getHousingAllowance());
        employee.setResponsibilityAllowance(newEmployee.getResponsibilityAllowance());
        employee.setRosterAllowance(newEmployee.getRosterAllowance());
        employee.setSmearAllowance(newEmployee.getSmearAllowance());
        employee.setOnCallAllowance(newEmployee.getOnCallAllowance());
        employee.setExceptionalAllowance(newEmployee.getExceptionalAllowance());
        employee.setTransportAllowance(newEmployee.getTransportAllowance());
        employee.setCashHandlingAllowance(newEmployee.getCashHandlingAllowance());
        employee.setClothingAllowance(newEmployee.getClothingAllowance());
        employee.setIndividualPerformance(newEmployee.getIndividualPerformance());
        employee.setPerformanceRate(newEmployee.getPerformanceRate());
        employee.setSurcharge(newEmployee.getSurcharge());
        employee.setSujetionAllowance(newEmployee.getSujetionAllowance());
        employee.setPrimeERT(newEmployee.getPrimeERT());
        employee.setRiskAllowance(newEmployee.getRiskAllowance());
        employee.setVacation(newEmployee.getVacation());
        employee.setSecurityAllowance(newEmployee.getSecurityAllowance());
        List<Promotion> promotions = employee.getPromotions();
        if (promotions == null)
            promotions = List.of(promotion);
        else
            promotions.add(promotion);
        employee.setPromotions(promotions);
        employeeRepository.save(employee);

    }

    @Override
    @Cacheable(cacheNames = "employeePromotions")
    public List<PromotionDetailsDTO> getAllPromotions() {
        return (List<PromotionDetailsDTO>) employeeRepository.findAllPromotions();
    }

    @Override
    @Cacheable(cacheNames = "employeeDropdown")
    public List<EmployeeNameDTO> getEmployeeDropdown() {
        return (List<EmployeeNameDTO>) employeeRepository.findEmployeeNames();
    }

    @Override
    @Cacheable(cacheNames = "employeeCountsByCategory")
    public List<Object[]> getEmployeeCountByCategory() {
        return employeeRepository.countEmployeesByCategory();
    }

    @Override
    @Cacheable(cacheNames = "employeeCountsByContractType")
    public List<Object[]> getEmployeeCountByContractType() {
        return employeeRepository.countEmployeesByContractType();
    }

    @Override
    @Cacheable(cacheNames = "employeeSectorGenderCount")
    public List<Object[]> getSectorGenderCount() {
        return employeeRepository.getSectorGenderCounts();
    }

    @Override
    @Cacheable(cacheNames = "employeeLast10ByCompany", key = "#companyId")
    public List<EmployeeDetailsDTO> getLast10Employees(Long companyId) {
        return employeeRepository.findLast10EmployeesByCompany(companyId);
    }

    @Override
    @Cacheable(cacheNames = "employeeNamesByCompany", key = "#companyId")
    public List<EmployeeNameDTO> getAllEmployeesByCompany(Long companyId) {
        return (List<EmployeeNameDTO>) employeeRepository.findEmployeeNamesByCompanyId(companyId);
    }

    @Override
    @Cacheable(cacheNames = "employeeSalary", key = "#employeeId")
    public Long getEmployeeSalary(Long employeeId) {
        List<Object[]> results = employeeRepository.getSalaryFields(employeeId);

        if (results.isEmpty() || results.get(0) == null) {
            return 0L;
        }

        Object[] salaryFields = results.get(0);

        Long totalSalary = Arrays.stream(salaryFields)
                .map(value -> {
                    if (value == null || value.toString().trim().isEmpty()) {
                        return 0L;
                    }
                    return Long.parseLong(value.toString().trim());
                })
                .reduce(0L, Long::sum);
        return totalSalary / 2;
    }

    @Override
    @Cacheable(cacheNames = "totalEmployeeCount")
    public Long getTotalEmployeeCount() {
        return employeeRepository.count();
    }

    @Override
    @Cacheable(cacheNames = "employeeContractCategories")
    public List<CategoryCount> getEmployeeContractCategoryCount() {
        return employeeRepository.countEmployeesByContract();
    }

    @Override
    @Cacheable(cacheNames = "employeesByIds", key = "#employeeIds")
    public List<EmployeeNameDTO> getEmployeesByIds(List<Long> employeeIds) {
        return employeeRepository.findEmployeesByIds(employeeIds);
    }

    @Override
    @Cacheable(cacheNames = "employeeEmailsByIds", key = "#employeeIds")
    public List<EmployeeEmailDTO> getEmployeeEmailsByIds(List<Long> employeeIds) {
        return employeeRepository.findEmployeeEmailsByIds(employeeIds);
    }

    @Override
    @Cacheable(cacheNames = "employeeNamesWithEmail")
    public List<EmployeeNameDTO> getEmployeeNamesWithEmail() {
        return (List<EmployeeNameDTO>) employeeRepository.findEmployeeNamesWithEmail();
    }

    @Override
    @Cacheable(cacheNames = "employeeEmailPosition")
    public List<EmpEmailPosResponse> getEmployeesWithEmailPosition() {
        return employeeRepository.findEmployeeNamesWithEmailAndPosition();
    }

    @Override
    @Cacheable(cacheNames = "employeeEmailPositionById", key = "#employeeId")
    public EmpEmailPosResponse getEmployeeEmailPositionById(Long employeeId) throws HRMSException {
        return employeeRepository.findEmployeeNamesWithEmailAndPositionById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
    }

    @Override
    @Cacheable(cacheNames = "employeeWithDepartment")
    public List<EmpEmailPosResponse> getEmployeesWithDepartment() {
        return employeeRepository.findEmployeeNamesWithDepartment();
    }

    @Override
    @Cacheable(cacheNames = "employeeDirectionByIds", key = "#ids")
    public List<EmployeeDirection> getEmployeeWithDirection(List<Long> ids) {
        return employeeRepository.findEmployeeWithDirection(ids);
    }

    @Override
    @Cacheable(cacheNames = "employeeDirectionAll")
    public List<EmployeeDirection> getAllEmployeeWithDirection() {
        return employeeRepository.findAllEmployeeWithDirection();
    }
}
