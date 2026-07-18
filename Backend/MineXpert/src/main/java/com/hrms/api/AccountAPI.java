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
import com.hrms.security.AdminRoles;
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
    public ResponseEntity<ResponseDTO> UpdatePassword(@RequestBody @Valid AccountDTO accountDTO,
            @CookieValue(name = "jwt", required = false) String token) throws Exception {
        // Authentification obligatoire (fermait l'escalade P0 : l'endpoint etait
        // totalement ouvert). Le parcours normal envoie login + ancien mot de
        // passe : la possession de l'ancien mot de passe, verifiee par le service,
        // fait foi. La branche « reset par id SANS ancien mot de passe » ne doit
        // etre accessible qu'a un ADMIN ou au titulaire du compte lui-meme.
        Claims claims = requireAuth(token);
        boolean byId = (accountDTO.getLogin() == null || accountDTO.getLogin().isBlank())
                && accountDTO.getId() != null;
        if (byId) {
            Long callerId = claims.get("id", Long.class);
            String role = claims.get("role", String.class);
            // Meme source de verite que requireAdmin : le test litteral precedent
            // (ADMIN / SUPER_ADMIN) ne correspondait a aucun role reel.
            if (!AdminRoles.isAdmin(role) && !accountDTO.getId().equals(callerId)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Not allowed to reset this account's password");
            }
        }
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

    // Lecture d'un compte : authentification requise (fermait un IDOR anonyme).
    @GetMapping("/get/{id}")
    public ResponseEntity<AccountDTO> getAccount(@PathVariable Long id,
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAuth(token);
        return new ResponseEntity<>(accountService.getAccount(id), HttpStatus.OK);
    }

    @GetMapping("/getByEmpId/{empId}")
    public ResponseEntity<AccountDTO> getAccountByEmpId(@PathVariable Long empId,
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAuth(token);
        return new ResponseEntity<>(accountService.getAccountByEmpId(empId), HttpStatus.OK);
    }

    // Listing complet + comptages inter-mines : reserve aux administrateurs
    // (fermait le listing de TOUS les comptes de TOUTES les mines par n'importe
    // quel utilisateur authentifie).
    @GetMapping("/getAll")
    public ResponseEntity<List<AccountDetailsDTO>> getAllAccounts(
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAdmin(token);
        return new ResponseEntity<>(accountService.getAllAccounts(), HttpStatus.OK);
    }

    @GetMapping("/getCounts")
    public ResponseEntity<List<Object[]>> getCountByCompany(
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAdmin(token);
        return new ResponseEntity<>(accountService.getCountsByCompany(), HttpStatus.OK);
    }

    @GetMapping("/getActives")
    public ResponseEntity<List<Object[]>> getActiveCountByCompany(
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAdmin(token);
        return new ResponseEntity<>(accountService.getActiveCountsByCompany(), HttpStatus.OK);
    }

    @GetMapping("/getAdmins")
    public ResponseEntity<List<Object[]>> getAdminsCountByCompany(
            @CookieValue(name = "jwt", required = false) String token) throws HRMSException {
        requireAdmin(token);
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
        // Source unique (AdminRoles) : le test litteral empechait un administrateur
        // reel (role « Administrator ») de consulter les permissions d'un autre compte.
        if (!id.equals(callerId) && !AdminRoles.isAdmin(callerRole)) {
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
        Claims claims = requireAuth(token);
        String role = claims.get("role", String.class);
        // Source de verite UNIQUE (AdminRoles) : cette garde n'acceptait que
        // ADMIN / SUPER_ADMIN, deux roles qui N'EXISTENT PAS en base. Les roles
        // reels sont Administrator (3 comptes) et SYSTEM_ADMINISTRATOR. Elle
        // refusait donc tous les administrateurs legitimes.
        if (!AdminRoles.isAdmin(role)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }

    /** Exige un cookie jwt valide ; renvoie les claims. 401 sinon. */
    private Claims requireAuth(String token) {
        if (token == null || token.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        try {
            return Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token).getBody();
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid or expired session");
        }
    }
}
