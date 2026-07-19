package com.hrms.api;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.Jwt.CustomUserDetails;
import com.hrms.Jwt.JwtHelper;
import com.hrms.directory.DirectoryService;
import com.hrms.dto.AuditLogDTO;
import com.hrms.dto.AuthenticationRequest;
import com.hrms.dto.AuthenticationResponse;
import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.security.MfaChallengeService;
import com.hrms.security.MfaChallengeService.Purpose;
import com.hrms.security.MfaRolePolicy;
import com.hrms.service.AuditLogService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@CrossOrigin
@RequestMapping("/auth")
public class AuthAPI {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtHelper helper;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private DirectoryService directoryService;

    @Autowired
    private com.hrms.service.LoginAttemptService loginAttemptService;

    @Autowired
    private MfaRolePolicy mfaRolePolicy;

    @Autowired
    private MfaChallengeService mfaChallengeService;

    private Logger logger = LoggerFactory.getLogger(AuthAPI.class);

    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET:}")
    private String SECRET;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest request,
            HttpServletResponse response) {
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("errorMessage", "Login is required", "errorCode", 400));
        }
        if (loginAttemptService.isBlocked(request.getLogin())) {
            long remaining = loginAttemptService.getRemainingBlockSeconds(request.getLogin());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                            "errorMessage", "Too many failed attempts. Try again in " + remaining + "s.",
                            "errorCode", 429,
                            "retryAfterSeconds", remaining));
        }
        try {
            Account preAccount = accountRepository.findByLogin(request.getLogin()).orElse(null);
            boolean adAccount = preAccount != null
                    && "ACTIVE_DIRECTORY".equalsIgnoreCase(preAccount.getIdentitySource());

            if (preAccount != null && !adAccount
                    && Boolean.TRUE.equals(preAccount.getFirstLogin())
                    && preAccount.getInvitationExpiresAt() != null
                    && LocalDateTime.now().isAfter(preAccount.getInvitationExpiresAt())) {
                try {
                    auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                            LocalDateTime.now(), "Login refused: invitation expired"));
                } catch (Exception ignored) { }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("errorMessage", "INVITATION_EXPIRED", "errorCode", 401));
            }

            if (adAccount) {
                if (!directoryService.authenticate(request.getLogin(), request.getPassword())) {
                    loginAttemptService.recordFailure(request.getLogin());
                    try {
                        auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                                LocalDateTime.now(), "Incorrect Password (annuaire AD)"));
                    } catch (Exception ignored) { }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));
                }
            } else {
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(request.getLogin(), request.getPassword()));
            }

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getLogin());
            final Account authenticatedAccount = accountRepository.findByLogin(request.getLogin())
                    .orElseThrow(() -> new UsernameNotFoundException("ACCOUNT_NOT_FOUND"));

            if (mfaRolePolicy.requiresMfa(authenticatedAccount.getRole())) {
                boolean enrolled = Boolean.TRUE.equals(authenticatedAccount.getMfaEnabled())
                        && authenticatedAccount.getMfaSecretEncrypted() != null
                        && !authenticatedAccount.getMfaSecretEncrypted().isBlank();
                MfaChallengeService.Challenge challenge = mfaChallengeService.issue(
                        authenticatedAccount.getId(), authenticatedAccount.getLogin(),
                        enrolled ? Purpose.VERIFY : Purpose.ENROLL);
                try {
                    auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                            LocalDateTime.now(), enrolled
                                    ? "Primary credential accepted; MFA required"
                                    : "Primary credential accepted; MFA enrollment required"));
                } catch (Exception ignored) { }
                return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of(
                        "errorCode", enrolled ? "MFA_REQUIRED" : "MFA_ENROLLMENT_REQUIRED",
                        "errorMessage", enrolled
                                ? "Verification multifacteur requise"
                                : "Enrolement multifacteur obligatoire",
                        "challenge", challenge.token(),
                        "expiresInSeconds", 300));
            }
            final String jwt = helper.generateToken(userDetails);

            try {
                auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                        LocalDateTime.now(), "Successfully Logged In"));
            } catch (Exception auditEx) {
                logger.warn("AuditLog non persiste pour login successful: {}", auditEx.getMessage());
            }

            ResponseCookie cookie = ResponseCookie.from("jwt", jwt)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .sameSite("None")
                    .maxAge(Duration.ofMillis(helper.getExpirationMillis()))
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            loginAttemptService.recordSuccess(request.getLogin());
            return ResponseEntity.ok("Login successful");

        } catch (UsernameNotFoundException e) {
            loginAttemptService.recordFailure(request.getLogin());
            try {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "LoginId not found"));
            } catch (Exception ignored) { }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));

        } catch (BadCredentialsException e) {
            loginAttemptService.recordFailure(request.getLogin());
            try {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "Incorrect Password"));
            } catch (Exception ignored) { }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));

        } catch (AuthenticationException e) {
            loginAttemptService.recordFailure(request.getLogin());
            try {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "Authentication error"));
            } catch (Exception ignored) { }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorMessage", "Incorrect username or password", "errorCode", 401));

        } catch (Exception e) {
            logger.error("Unexpected login error for {}: {}", request.getLogin(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("errorMessage", "Internal server error", "errorCode", 500));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@CookieValue(name = "jwt", required = false) String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("JWT cookie is missing");
        }

        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRET)
                    .parseClaimsJws(token)
                    .getBody();

            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired JWT");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response) {
        // LOT 42 hotfix : retrait du .domain(".data-univers.com") qui empêche
        // la suppression du cookie sur safex360-gateway.onrender.com (domain
        // mismatch). Le cookie de logout doit cibler le même domaine que le
        // cookie de login (par défaut = host du backend).
        ResponseCookie expiredCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("None")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
        return ResponseEntity.ok("Logged out");
    }

}
