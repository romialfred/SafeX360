package com.hrms.api;

import java.nio.file.Files;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

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

    // [AUTHZ-01] Cloisonnement mine des lectures d'employes (PII/salaires).
    @Autowired
    private com.hrms.security.EmployeeScopeGuard employeeScopeGuard;

    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String jwtSecret;

    /**
     * Garde admin sur cookie JWT — même pattern qu'AccountAPI.requireAdmin.
     * Le SecurityContext n'étant pas alimenté par le cookie, la vérification
     * du rôle se fait directement sur le claim "role" du token.
     */
    private void requireAdmin(String token) {
        if (token == null || token.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.parser()
                .setSigningKey(jwtSecret).parseClaimsJws(token).getBody();
        String role = claims.get("role", String.class);
        // Source unique (AdminRoles) : ADMIN / SUPER_ADMIN n'existent dans aucun
        // compte ; les roles reels sont Administrator et SYSTEM_ADMINISTRATOR.
        // Ce test refusait donc TOUS les administrateurs.
        if (!com.hrms.security.AdminRoles.isAdmin(role)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }

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
        EmployeeDTO employee = employeeService.getEmployee(id);
        // [AUTHZ-01] L'employe demande doit appartenir a une mine autorisee de
        // l'appelant (admins/all-mines et appels service-a-service exemptes).
        employeeScopeGuard.assertInScope(companyIdOf(employee));
        return new ResponseEntity<>(employee, HttpStatus.OK);
    }

    @GetMapping("/getByUnique/{uniqueNumber}")
    public ResponseEntity<EmployeeLeaveBalance> getEmployeeByUniqueNumber(@PathVariable String uniqueNumber)
            throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployeeByUniqueNumber(uniqueNumber), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<EmployeeDetailsDTO>> getAllEmployees() {
        // [AUTHZ-01] Filtrage de resultats par mine : un appelant utilisateur
        // cloisonne ne voit que les employes de son perimetre. Appels
        // service-a-service / admin / toutes-mines : liste inchangee (le filtrage
        // a lieu APRES le cache, jamais dedans, pour ne pas empoisonner le cache).
        List<EmployeeDetailsDTO> all = employeeService.getAllEmployees();
        return new ResponseEntity<>(
                employeeScopeGuard.filterByCompany(all, EmployeeDetailsDTO::getCompanyId),
                HttpStatus.OK);
    }

    @GetMapping("/getByDepartment/{departmentId}")
    public ResponseEntity<List<EmployeeNameDTO>> getAllEmployeesByDepartment(@PathVariable Long departmentId) {
        return new ResponseEntity<>(employeeService.getAllEmployeesByDepartment(departmentId), HttpStatus.OK);
    }

    @GetMapping("/getByCompany/{companyId}")
    public ResponseEntity<List<EmployeeNameDTO>> getAllEmployeesByCompany(@PathVariable Long companyId) {
        // [AUTHZ-01] La mine demandee doit etre dans le perimetre de l'appelant.
        employeeScopeGuard.assertInScope(companyId);
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
        // [AUTHZ-01] La photo est une donnee de l'employe : on resout sa mine et on
        // verifie l'appartenance au perimetre (403 hors perimetre ; appels
        // service-a-service / admin / toutes-mines exemptes par la garde).
        employeeScopeGuard.assertInScope(companyIdOf(employeeService.getEmployee(employeeId)));
        return new ResponseEntity<>(employeeService.getPicture(employeeId), HttpStatus.OK);
    }

    // [AUTHZ-01] files/{fileName} et profile-picture/{fileName} servent un fichier
    // par NOM DE FICHIER HACHÉ, sans lien inverse fichier -> employe/mine dans le
    // modele (Documents est une collection fille d'Employee, aucune requete par
    // chemin). Impossible de deriver la mine ici sans changement de schema invasif :
    // ces endpoints restent inchanges (le hash du nom fait office de capacite non
    // enumerable). Documente au titre du residuel AUTHZ-01.
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

    // Promotion = action RH sensible : restreinte ADMIN/SUPER_ADMIN via le
    // cookie JWT (le TODO LOT 41 est soldé par requireAdmin ci-dessus).
    @PostMapping("/promote")
    public ResponseEntity<ResponseDTO> promoteEmployee(@RequestBody EmployeeDTO employeeDTO,
            @RequestParam(name = "recommendedBy", required = false) Long recommendedBy,
            @RequestParam("approvedBy") Long approvedBy, @RequestParam("reason") String reason,
            @RequestParam("endDate") LocalDate endDate,
            @org.springframework.web.bind.annotation.CookieValue(name = "jwt", required = false) String token)
            throws HRMSException {
        requireAdmin(token);
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
    public ResponseEntity<Long> getEmployeeSalary(@PathVariable Long employeeId) throws HRMSException {
        // [AUTHZ-01] Donnee la plus sensible : on resout la mine de l'employe puis
        // on verifie qu'elle est dans le perimetre de l'appelant avant tout retour.
        employeeScopeGuard.assertInScope(companyIdOf(employeeService.getEmployee(employeeId)));
        return new ResponseEntity<>(employeeService.getEmployeeSalary(employeeId), HttpStatus.OK);
    }

    /** Extrait l'id de mine d'un employe, ou {@code null} si non rattache. */
    private static Long companyIdOf(EmployeeDTO employee) {
        return employee != null && employee.getCompany() != null
                ? employee.getCompany().getId()
                : null;
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
        // [AUTHZ-01] Retour PARTIEL (jamais d'erreur) : on ecarte les employes hors
        // du perimetre de l'appelant. Le DTO ne portant pas la mine, on resout le
        // sous-ensemble d'ids autorises. Service-a-service : liste inchangee.
        List<EmployeeNameDTO> result = employeeService.getEmployeesByIds(ids);
        return new ResponseEntity<>(retainInScopeById(result, EmployeeNameDTO::getId, ids), HttpStatus.OK);
    }

    @GetMapping("/getAllWithEmailAndPosition")
    public ResponseEntity<List<EmpEmailPosResponse>> getAllEmployeesWithEmailAndPosition() {
        return new ResponseEntity<>(employeeService.getEmployeesWithEmailPosition(), HttpStatus.OK);
    }

    @GetMapping("/getEmailsByIds")
    public ResponseEntity<List<EmployeeEmailDTO>> getEmployeeEmailsByIds(@RequestParam List<Long> ids) {
        // [AUTHZ-01] Meme filtrage partiel par ids que getByIds (le DTO email ne
        // porte pas la mine). Service-a-service : liste inchangee.
        List<EmployeeEmailDTO> result = employeeService.getEmployeeEmailsByIds(ids);
        return new ResponseEntity<>(retainInScopeById(result, EmployeeEmailDTO::getId, ids), HttpStatus.OK);
    }

    /**
     * [AUTHZ-01] Filtre une liste de DTO identifies par employeeId pour ne garder
     * que les entrees dans le perimetre de l'appelant. Ne leve jamais d'erreur :
     * retour partiel. Aucun filtrage (service-a-service / admin / toutes-mines)
     * => liste inchangee, et aucune requete BDD supplementaire n'est emise.
     */
    private <T> List<T> retainInScopeById(List<T> items,
            java.util.function.Function<T, Long> idOf, List<Long> requestedIds) {
        if (items == null || items.isEmpty()) {
            return items;
        }
        Set<Long> scope = employeeScopeGuard.filterableCompanyScope();
        if (scope == null) {
            return items; // pas de cloisonnement a appliquer
        }
        java.util.Set<Long> allowedIds = new java.util.HashSet<>(
                employeeService.getIdsInCompanies(requestedIds, scope));
        return items.stream()
                .filter(item -> allowedIds.contains(idOf.apply(item)))
                .toList();
    }

    @GetMapping("/getEmpEmailAndPosition/{employeeId}")
    public ResponseEntity<EmpEmailPosResponse> getEmployeesWithEmailAndPositionById(@PathVariable Long employeeId)
            throws HRMSException {
        return new ResponseEntity<>(employeeService.getEmployeeEmailPositionById(employeeId), HttpStatus.OK);
    }

    @GetMapping("/getEmployeesWithDepartment")
    public ResponseEntity<List<EmpEmailPosResponse>> getEmployeesWithDepartment(
            @RequestParam(required = false) Long companyId) {
        // Cloisonnement par mine : companyId auto-injecté par l'intercepteur.
        // L'effectif renvoyé est celui de la mine active (ex. 153), pas le total.
        return new ResponseEntity<>(employeeService.getEmployeesWithDepartment(companyId), HttpStatus.OK);
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
