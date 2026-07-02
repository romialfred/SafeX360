package com.hrms.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.AccountDetailsDTO;
import com.hrms.DataInterface.AccountNameDTO;
import com.hrms.dto.AccountDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.AccountService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/account")
@Validated
public class AccountAPI {
    @Autowired
    private AccountService accountService;

    // LOT 53 (fix boucle login) : clé externalisée, alignee sur JwtHelper/AuthAPI.
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String SECRET;

    @PostMapping("/add")
    public ResponseEntity<?> addAccount(@RequestBody @Valid AccountDTO accountDTO,
            @CookieValue(name = "jwt", required = false) String token) throws Exception {
        requireAdmin(token);
        accountService.addAccount(accountDTO);
        return new ResponseEntity<>(new ResponseDTO("Account added Successfully."), HttpStatus.CREATED);
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateAccount(@RequestBody @Valid AccountDTO accountDTO,
            @CookieValue(name = "jwt", required = false) String token) throws Exception {
        requireAdmin(token);
        accountService.updateAccount(accountDTO);
        return new ResponseEntity<>(new ResponseDTO("Account updated Successfully."), HttpStatus.OK);
    }

    @PostMapping("/update-password")
    public ResponseEntity<ResponseDTO> UpdatePassword(@RequestBody @Valid AccountDTO accountDTO) throws Exception {
        accountService.updatePassword(accountDTO);
        return new ResponseEntity<>(new ResponseDTO("Password Updated Successfully."), HttpStatus.OK);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ResponseDTO> resetPassword(@RequestBody @Valid AccountDTO accountDTO) throws Exception {
        accountService.resetPassword(accountDTO);
        return new ResponseEntity<>(new ResponseDTO("Password Reset Successful."), HttpStatus.OK);
    }

    @PostMapping("/send-password")
    public ResponseEntity<ResponseDTO> sendUpdatedPassword(@RequestBody @Valid AccountDTO accountDTO) throws Exception {
        accountService.sendUpdatedPassword(accountDTO);
        return new ResponseEntity<>(new ResponseDTO("Email Sent Successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<AccountDTO> getAccount(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(accountService.getAccount(id), HttpStatus.OK);
    }

    @GetMapping("/getByEmpId/{empId}")
    public ResponseEntity<AccountDTO> getAccountByEmpId(@PathVariable Long empId) throws HRMSException {
        return new ResponseEntity<>(accountService.getAccountByEmpId(empId), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<AccountDetailsDTO>> getAllAccounts() throws HRMSException {
        return new ResponseEntity<>(accountService.getAllAccounts(), HttpStatus.OK);
    }

    @GetMapping("/getCounts")
    public ResponseEntity<List<Object[]>> getCountByCompany() throws HRMSException {
        return new ResponseEntity<>(accountService.getCountsByCompany(), HttpStatus.OK);
    }

    @GetMapping("/getActives")
    public ResponseEntity<List<Object[]>> getActiveCountByCompany() throws HRMSException {
        return new ResponseEntity<>(accountService.getActiveCountsByCompany(), HttpStatus.OK);
    }

    @GetMapping("/getAdmins")
    public ResponseEntity<List<Object[]>> getAdminsCountByCompany() throws HRMSException {
        return new ResponseEntity<>(accountService.getAdminCountsByCompany(), HttpStatus.OK);
    }

    @GetMapping("/getEmpIds")
    public ResponseEntity<List<Long>> getEmpIds() throws HRMSException {
        return new ResponseEntity<>(accountService.getAllEmpIds(), HttpStatus.OK);
    }

    @GetMapping("/getLeaveApprover/{departmentId}")
    public ResponseEntity<List<AccountNameDTO>> getLeaveApprover(@PathVariable Long departmentId) throws HRMSException {
        return new ResponseEntity<>(accountService.getLeaveApprover(departmentId), HttpStatus.OK);
    }

    @GetMapping("/getSalaryAdvanceApprover/{companyId}")
    public ResponseEntity<List<AccountNameDTO>> getSalaryAdvanceApprover(@PathVariable Long companyId)
            throws HRMSException {
        return new ResponseEntity<>(accountService.getSalaryAdvanceApprover(companyId), HttpStatus.OK);
    }

    // @PostMapping("/sendOtp/{email}")
    // public ResponseEntity<ResponseDTO> sendOtp(@PathVariable String email) throws
    // HRMSException {
    // accountService.sendOtp(email);
    // return new ResponseEntity<>(new ResponseDTO("OTP Sent."), HttpStatus.OK);
    // }

    @GetMapping("/getPermissions")
    public ResponseEntity<AccountDetailsDTO> getPermissions(@CookieValue(name = "jwt", required = false) String token)
            throws HRMSException {
        Claims claims = Jwts.parser()
                .setSigningKey(SECRET)
                .parseClaimsJws(token)
                .getBody();
        Long id = claims.get("id", Long.class);
        return new ResponseEntity<>(accountService.getAccountPermissions(id), HttpStatus.OK);
    }

    @GetMapping("/getPermissionsById/{id}")
    public ResponseEntity<AccountDetailsDTO> getPermissionsById(
            @PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        if (token == null || token.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Claims callerClaims = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token).getBody();
        Long callerId = callerClaims.get("id", Long.class);
        String callerRole = callerClaims.get("role", String.class);
        if (!id.equals(callerId) && !"ADMIN".equalsIgnoreCase(callerRole) && !"SUPER_ADMIN".equalsIgnoreCase(callerRole)) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        return new ResponseEntity<>(accountService.getAccountPermissions(id), HttpStatus.OK);
    }

    @PutMapping("/updatePermissions")
    public ResponseEntity<?> updatePermissions(@RequestBody AccountDTO accountDTO,
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAdmin(token);
        accountService.updateAccountPermissions(accountDTO);
        return new ResponseEntity<>(new ResponseDTO("Permissions updated."), HttpStatus.OK);
    }

    private void requireAdmin(String token) {
        if (token == null || token.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Claims claims = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token).getBody();
        String role = claims.get("role", String.class);
        if (!"ADMIN".equalsIgnoreCase(role) && !"SUPER_ADMIN".equalsIgnoreCase(role)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }
}
