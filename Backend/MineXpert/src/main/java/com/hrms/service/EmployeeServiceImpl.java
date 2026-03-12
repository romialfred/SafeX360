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

    private static final String UPLOAD_DIR = "M:/hrmsDocs/";
    // private static final String UPLOAD_DIR = "C:/apps/HRMSAppDocuments/";

    @Override
    public void addEmployee(EmployeeDTO employeeDTO) throws HRMSException {
        if (employeeRepository.findByUniqueNumber(employeeDTO.getUniqueNumber()).isPresent())
            throw new HRMSException("UNIQUE_NUMBER_EXISTS");
        if (employeeRepository.findByLogin(employeeDTO.getLogin()).isPresent())
            throw new HRMSException("LOGIN_ALREADY_EXISTS");
        employeeRepository.save(employeeDTO.toEntity());
    }

    @Override
    public EmployeeDTO getEmployee(Long id) throws HRMSException {
        return employeeRepository.findById(id).orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND")).toDTO();
    }

    @Override
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
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'deleteEmployee'");
    }

    @Override
    public List<EmployeeDetailsDTO> getAllEmployees() {
        return ((List<EmployeeDetailsDTO>) employeeRepository.findAllEmployeeDetails());
    }

    @Override
    public List<EmployeeNameDTO> getQualifiedEmployees() {
        return (List<EmployeeNameDTO>) employeeRepository.findQualifiedEmployeeNames();

    }

    @Override
    public List<Object[]> getCountsByCompany() {
        return employeeRepository.countEmployeesByCompany();
    }

    @Override
    public List<Object[]> getCountsByDepartment() {
        return employeeRepository.countEmployeesByDepartment();
    }

    @Override
    public List<Object[]> getCountsByGender() {
        return employeeRepository.countEmployeesByGender();
    }

    @Override
    public List<Object[]> getCountsByCompanyAndGender() {
        return employeeRepository.countEmployeesByCompanyAndGender();
    }

    @Override
    public EmployeeLeaveBalance getEmployeeByUniqueNumber(String uniqueNumber) throws HRMSException {
        return employeeRepository.findByUniqueNumber(uniqueNumber)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
    }

    @Override
    public List<Object[]> getCountsBySeniority() {
        return employeeRepository.getEmployeeExperienceGroups();
    }

    @Override
    public Long getDepartmentCount(Long departmentId) {
        return employeeRepository.countEmployeesInDepartment(departmentId);
    }

    @Override
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

    @Override
    public Resource getDocument(String doc) throws Exception {
        Path path = Paths.get(UPLOAD_DIR + doc);
        if (Files.exists(path)) {
            Resource resource = new UrlResource(path.toUri());
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = "application/octet-stream"; // Default content type if not found
            }
            return resource;
        } else {
            throw new Exception("File not found.");
        }
    }

    @Override
    public Resource getProfilePicture(String doc) throws Exception {
        Path path = Paths.get(UPLOAD_DIR + doc);
        if (Files.exists(path)) {
            Resource resource = new UrlResource(path.toUri());
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = "application/octet-stream"; // Default content type if not found
            }
            return resource;
        } else {
            throw new Exception("File not found.");
        }
    }

    @Override
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
    public void deletePicture(Long employeeId) throws HRMSException {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        employee.setProfilePicture(null);
        employeeRepository.save(employee);
    }

    @Override
    public List<EmployeeNameDTO> getAllEmployeesByDepartment(Long departmentId) {
        return ((List<EmployeeNameDTO>) employeeRepository.findEmployeeNamesByDepartmentId(departmentId));
    }

    @Override
    public List<EmployeeNameDTO> getAllHRApproversByCompany(Long companyId) {
        return ((List<EmployeeNameDTO>) employeeRepository
                .findEmployeeNamesByDepartmentAndCompany("Human Resource", companyId));
    }

    @Override
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
    public List<PromotionDetailsDTO> getAllPromotions() {
        // List<Employee> employees = (List<Employee>)employeeRepository.findAll();
        // return employees.stream().filter(e->e.getPromotions()!=null &&
        // !e.getPromotions().isEmpty())
        // .map(e -> new EmployeePromotionDTO(
        // e.getId(),
        // e.getFirstName(),
        // e.getFamilyName(),
        // e.getPromotions()))
        // .collect(Collectors.toList());
        return (List<PromotionDetailsDTO>) employeeRepository.findAllPromotions();
    }

    @Override
    public List<EmployeeNameDTO> getEmployeeDropdown() {
        return (List<EmployeeNameDTO>) employeeRepository.findEmployeeNames();
    }

    @Override
    public List<Object[]> getEmployeeCountByCategory() {
        return employeeRepository.countEmployeesByCategory();
    }

    @Override
    public List<Object[]> getEmployeeCountByContractType() {
        return employeeRepository.countEmployeesByContractType();
    }

    @Override
    public List<Object[]> getSectorGenderCount() {
        return employeeRepository.getSectorGenderCounts();
    }

    @Override
    public List<EmployeeDetailsDTO> getLast10Employees(Long companyId) {
        return employeeRepository.findLast10EmployeesByCompany(companyId);
    }

    @Override
    public List<EmployeeNameDTO> getAllEmployeesByCompany(Long companyId) {
        return (List<EmployeeNameDTO>) employeeRepository.findEmployeeNamesByCompanyId(companyId);
    }

    @Override
    public Long getEmployeeSalary(Long employeeId) {
        List<Object[]> results = employeeRepository.getSalaryFields(employeeId);

        if (results.isEmpty() || results.get(0) == null) {
            return 0L;
        }

        Object[] salaryFields = results.get(0);

        Long totalSalary = Arrays.stream(salaryFields)
                .map(value -> {
                    if (value == null || value.toString().trim().isEmpty()) {
                        return 0L; // Handle NULL and empty string
                    }
                    return Long.parseLong(value.toString().trim());
                })
                .reduce(0L, Long::sum);
        return totalSalary / 2;
    }

    @Override
    public Long getTotalEmployeeCount() {
        return employeeRepository.count();
    }

    @Override
    public List<CategoryCount> getEmployeeContractCategoryCount() {
        return employeeRepository.countEmployeesByContract();
    }

    @Override
    public List<EmployeeNameDTO> getEmployeesByIds(List<Long> employeeIds) {
        return employeeRepository.findEmployeesByIds(employeeIds);
    }

    @Override
    public List<EmployeeEmailDTO> getEmployeeEmailsByIds(List<Long> employeeIds) {
        return employeeRepository.findEmployeeEmailsByIds(employeeIds);
    }

    @Override
    public List<EmployeeNameDTO> getEmployeeNamesWithEmail() {
        return (List<EmployeeNameDTO>) employeeRepository.findEmployeeNamesWithEmail();
    }

    @Override
    public List<EmpEmailPosResponse> getEmployeesWithEmailPosition() {
        return employeeRepository.findEmployeeNamesWithEmailAndPosition();
    }

    @Override
    public EmpEmailPosResponse getEmployeeEmailPositionById(Long employeeId) throws HRMSException {
        return employeeRepository.findEmployeeNamesWithEmailAndPositionById(employeeId)
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
    }

    @Override
    public List<EmpEmailPosResponse> getEmployeesWithDepartment() {
        return employeeRepository.findEmployeeNamesWithDepartment();
    }

    @Override
    public List<EmployeeDirection> getEmployeeWithDirection(List<Long> ids) {
        return employeeRepository.findEmployeeWithDirection(ids);
    }

    @Override
    public List<EmployeeDirection> getAllEmployeeWithDirection() {
        return employeeRepository.findAllEmployeeWithDirection();
    }
}
