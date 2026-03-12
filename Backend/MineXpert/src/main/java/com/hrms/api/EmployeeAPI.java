package com.hrms.api;

import java.nio.file.Files;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.EmployeeService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@CrossOrigin
@RequestMapping("/employee")
@Validated
public class EmployeeAPI {
    @Autowired
    private EmployeeService employeeService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addEmployee(@RequestBody @Valid EmployeeDTO employeeDTO) throws HRMSException {
        employeeService.addEmployee(employeeDTO);
        return new ResponseEntity<>(new ResponseDTO("Employee added Successfully."), HttpStatus.CREATED);
    }

    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateEmployee(@RequestBody @Valid EmployeeDTO employeeDTO)
            throws HRMSException {
        employeeService.updateEmployee(employeeDTO);
        return new ResponseEntity<>(new ResponseDTO("Employee updated Successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<EmployeeDTO> getEmployee(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployee(id), HttpStatus.OK);
    }

    @GetMapping("/getByUnique/{uniqueNumber}")
    public ResponseEntity<EmployeeLeaveBalance> getEmployeeByUniqueNumber(@PathVariable String uniqueNumber)
            throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployeeByUniqueNumber(uniqueNumber), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<EmployeeDetailsDTO>> getAllEmployees() {
        return new ResponseEntity<>(employeeService.getAllEmployees(), HttpStatus.OK);
    }

    @GetMapping("/getByDepartment/{departmentId}")
    public ResponseEntity<List<EmployeeNameDTO>> getAllEmployeesByDepartment(@PathVariable Long departmentId) {
        return new ResponseEntity<>(employeeService.getAllEmployeesByDepartment(departmentId), HttpStatus.OK);
    }

    @GetMapping("/getByCompany/{companyId}")
    public ResponseEntity<List<EmployeeNameDTO>> getAllEmployeesByCompany(@PathVariable Long companyId) {
        return new ResponseEntity<>(employeeService.getAllEmployeesByCompany(companyId), HttpStatus.OK);
    }

    @GetMapping("/getHRApprovers/{companyId}")
    public ResponseEntity<List<EmployeeNameDTO>> getAllHRApproversByCompany(@PathVariable Long companyId) {
        return new ResponseEntity<>(employeeService.getAllHRApproversByCompany(companyId), HttpStatus.OK);
    }

    @GetMapping("/getQualified")
    public ResponseEntity<List<EmployeeNameDTO>> getQualifiedEmployees() {
        return new ResponseEntity<>(employeeService.getQualifiedEmployees(), HttpStatus.OK);
    }

    @GetMapping("/getCounts")
    public ResponseEntity<List<Object[]>> getCountByCompany() throws HRMSException {
        return new ResponseEntity<>(employeeService.getCountsByCompany(), HttpStatus.OK);
    }

    @GetMapping("/getGenderCount")
    public ResponseEntity<List<Object[]>> getCountByGender() throws HRMSException {
        return new ResponseEntity<>(employeeService.getCountsByGender(), HttpStatus.OK);
    }

    @GetMapping("/getDepartmentCount")
    public ResponseEntity<List<Object[]>> getCountByDepartment() throws HRMSException {
        return new ResponseEntity<>(employeeService.getCountsByDepartment(), HttpStatus.OK);
    }

    @GetMapping("/getGenderAndCompany")
    public ResponseEntity<List<Object[]>> getCountByGenderAndCompany() throws HRMSException {
        return new ResponseEntity<>(employeeService.getCountsByCompanyAndGender(), HttpStatus.OK);
    }

    @GetMapping("/getSeniorityCount")
    public ResponseEntity<List<Object[]>> getCountBySeniority() throws HRMSException {
        return new ResponseEntity<>(employeeService.getCountsBySeniority(), HttpStatus.OK);
    }

    @GetMapping("/getCategoryCount")
    public ResponseEntity<List<Object[]>> getCountByCategory() throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployeeCountByCategory(), HttpStatus.OK);
    }

    @GetMapping("/getContractCount")
    public ResponseEntity<List<Object[]>> getCountByContractType() throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployeeCountByContractType(), HttpStatus.OK);
    }

    @GetMapping("/getDepartmentCount/{departmentId}")
    public ResponseEntity<Long> getDepartmentCount(@PathVariable Long departmentId) throws HRMSException {
        return new ResponseEntity<>(employeeService.getDepartmentCount(departmentId), HttpStatus.OK);
    }

    @PostMapping("/addDocument")
    public ResponseEntity<DocumentsDTO> addDocument(@RequestParam("file") MultipartFile file,
            @RequestParam("employeeId") Long employeeId, @RequestParam("name") String name) throws Exception {
        return new ResponseEntity<>(employeeService.addDocument(employeeId, name, file), HttpStatus.CREATED);
    }

    @PostMapping("/update-profile")
    public ResponseEntity<String> updateProfilePicture(@RequestParam("file") MultipartFile file,
            @RequestParam("employeeId") Long employeeId) throws Exception {
        return new ResponseEntity<>(employeeService.updateProfilePicture(employeeId, file), HttpStatus.CREATED);
    }

    @GetMapping("/getPicture/{employeeId}")
    public ResponseEntity<String> getPicture(@PathVariable Long employeeId) throws Exception {
        return new ResponseEntity<>(employeeService.getPicture(employeeId), HttpStatus.OK);
    }

    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        try {
            // Call the service to retrieve the document
            Resource resource = employeeService.getDocument(fileName);

            String contentType = "application/pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/profile-picture/{fileName}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String fileName) {
        try {
            Resource resource = employeeService.getProfilePicture(fileName);

            String contentType = Files.probeContentType(resource.getFile().toPath());
            if (contentType == null) {

                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/deleteDocument")
    public ResponseEntity<ResponseDTO> deleteDocument(@RequestParam("id") Long id,
            @RequestParam("employeeId") Long employeeId)
            throws HRMSException {
        employeeService.deleteDocument(id, employeeId);
        return new ResponseEntity<>(new ResponseDTO("Document deleted Successfully."), HttpStatus.OK);
    }

    @PutMapping("/deletePicture/{employeeId}")
    public ResponseEntity<ResponseDTO> deletePicture(@PathVariable Long employeeId)
            throws HRMSException {
        employeeService.deletePicture(employeeId);
        return new ResponseEntity<>(new ResponseDTO("Profile Picture deleted Successfully."), HttpStatus.OK);
    }

    @PostMapping("/promote")
    public ResponseEntity<ResponseDTO> promoteEmployee(@RequestBody EmployeeDTO employeeDTO,
            @RequestParam(name = "recommendedBy", required = false) Long recommendedBy,
            @RequestParam("approvedBy") Long approvedBy, @RequestParam("reason") String reason,
            @RequestParam("endDate") LocalDate endDate) throws HRMSException {
        employeeService.promoteEmployee(employeeDTO, recommendedBy, approvedBy, reason, endDate);
        return new ResponseEntity<>(new ResponseDTO("Employee promoted Successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAllPromotions")
    public ResponseEntity<List<PromotionDetailsDTO>> getAllPromotions() {
        return new ResponseEntity<>(employeeService.getAllPromotions(), HttpStatus.OK);
    }

    @GetMapping("/getEmployeeDropdown")
    public ResponseEntity<List<EmployeeNameDTO>> getEmployeeDropdown() {
        return new ResponseEntity<>(employeeService.getEmployeeDropdown(), HttpStatus.OK);
    }

    @GetMapping("/getEmployeeDropdownWithEmail")
    public ResponseEntity<List<EmployeeNameDTO>> getEmployeeDropdownWithEmail() {
        return new ResponseEntity<>(employeeService.getEmployeeNamesWithEmail(), HttpStatus.OK);
    }

    @GetMapping("/getSectorGenderCount")
    public ResponseEntity<List<Object[]>> getSectorGenderCount() {
        return new ResponseEntity<>(employeeService.getSectorGenderCount(), HttpStatus.OK);
    }

    @GetMapping("/last10/{companyId}")
    public ResponseEntity<List<EmployeeDetailsDTO>> getLast10HiredEmployee(@PathVariable Long companyId) {
        return new ResponseEntity<>(employeeService.getLast10Employees(companyId), HttpStatus.OK);
    }

    @GetMapping("/getSalary/{employeeId}")
    public ResponseEntity<Long> getEmployeeSalary(@PathVariable Long employeeId) {
        return new ResponseEntity<>(employeeService.getEmployeeSalary(employeeId), HttpStatus.OK);
    }

    @GetMapping("/getTotalCount")
    public ResponseEntity<Long> getTotalEmployeeCount() {
        return new ResponseEntity<>(employeeService.getTotalEmployeeCount(), HttpStatus.OK);
    }

    @GetMapping("/getContractCategoryCount")
    public ResponseEntity<List<CategoryCount>> getEmployeeContractCategoryCount() {
        return new ResponseEntity<>(employeeService.getEmployeeContractCategoryCount(), HttpStatus.OK);
    }

    @GetMapping("/getByIds")
    public ResponseEntity<List<EmployeeNameDTO>> getEmployeesByIds(@RequestParam List<Long> ids) {
        return new ResponseEntity<>(employeeService.getEmployeesByIds(ids), HttpStatus.OK);
    }

    @GetMapping("/getAllWithEmailAndPosition")
    public ResponseEntity<List<EmpEmailPosResponse>> getAllEmployeesWithEmailAndPosition() {
        return new ResponseEntity<>(employeeService.getEmployeesWithEmailPosition(), HttpStatus.OK);
    }

    @GetMapping("/getEmailsByIds")
    public ResponseEntity<List<EmployeeEmailDTO>> getEmployeeEmailsByIds(@RequestParam List<Long> ids) {
        return new ResponseEntity<>(employeeService.getEmployeeEmailsByIds(ids), HttpStatus.OK);
    }

    @GetMapping("/getEmpEmailAndPosition/{employeeId}")
    public ResponseEntity<EmpEmailPosResponse> getEmployeesWithEmailAndPositionById(@PathVariable Long employeeId)
            throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployeeEmailPositionById(employeeId), HttpStatus.OK);
    }

    @GetMapping("/getEmployeesWithDepartment")
    public ResponseEntity<List<EmpEmailPosResponse>> getEmployeesWithDepartment() {
        return new ResponseEntity<>(employeeService.getEmployeesWithDepartment(), HttpStatus.OK);
    }

    @GetMapping("/getEmployeeWithDirection")
    public ResponseEntity<List<EmployeeDirection>> getEmployeeWithDirection(@RequestParam List<Long> ids) {
        return new ResponseEntity<>(employeeService.getEmployeeWithDirection(ids), HttpStatus.OK);
    }

    @GetMapping("/getAllEmployeeWithDirection")
    public ResponseEntity<List<EmployeeDirection>> getAllEmployeeWithDirection() {
        return new ResponseEntity<>(employeeService.getAllEmployeeWithDirection(), HttpStatus.OK);
    }
}
