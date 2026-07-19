package com.hrms.api;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.Jwt.JwtHelper;
import com.hrms.dto.AuditLogDTO;
import com.hrms.entity.Account;
import com.hrms.security.MfaChallengeService.MfaChallengeException;
import com.hrms.security.MfaService;
import com.hrms.security.MfaService.MfaException;
import com.hrms.service.AuditLogService;
import com.hrms.service.LoginAttemptService;

import jakarta.servlet.http.HttpServletResponse;

/** Second facteur obligatoire apres validation du mot de passe. */
@RestController
@RequestMapping("/auth/mfa")
public class MfaController {

    public record ChallengeRequest(String challenge) { }
    public record CodeRequest(String challenge, String code, String recoveryCode) { }
    public record EnrollmentResponse(String manualKey, String otpAuthUri) { }
    public record RecoveryCodesResponse(List<String> recoveryCodes, boolean loginRequired) { }

    private final MfaService mfa;
    private final JwtHelper jwtHelper;
    private final UserDetailsService users;
    private final AuditLogService audit;
    private final LoginAttemptService loginAttempts;

    public MfaController(MfaService mfa, JwtHelper jwtHelper, UserDetailsService users,
            AuditLogService audit, LoginAttemptService loginAttempts) {
        this.mfa = mfa;
        this.jwtHelper = jwtHelper;
        this.users = users;
        this.audit = audit;
        this.loginAttempts = loginAttempts;
    }

    @PostMapping("/enroll/start")
    public ResponseEntity<?> start(@RequestBody ChallengeRequest request) {
        try {
            MfaService.Enrollment enrollment = mfa.beginEnrollment(request.challenge());
            return ResponseEntity.ok(new EnrollmentResponse(enrollment.manualKey(), enrollment.otpAuthUri()));
        } catch (MfaException | MfaChallengeException ex) {
            return failure(ex.getMessage());
        }
    }

    @PostMapping("/enroll/confirm")
    public ResponseEntity<?> confirm(@RequestBody CodeRequest request) {
        try {
            MfaService.EnrollmentResult result = mfa.confirmEnrollment(request.challenge(), request.code());
            return ResponseEntity.ok(new RecoveryCodesResponse(result.recoveryCodes(), true));
        } catch (MfaException | MfaChallengeException ex) {
            return failure(ex.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody CodeRequest request, HttpServletResponse response) {
        try {
            Account account = mfa.verify(request.challenge(), request.code(), request.recoveryCode());
            UserDetails userDetails = users.loadUserByUsername(account.getLogin());
            String jwt = jwtHelper.generateToken(userDetails);
            ResponseCookie cookie = ResponseCookie.from("jwt", jwt)
                    .httpOnly(true).secure(true).path("/").sameSite("None")
                    .maxAge(Duration.ofMillis(jwtHelper.getExpirationMillis())).build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            loginAttempts.recordSuccess(account.getLogin());
            safeAudit(account.getLogin(), request.recoveryCode() == null || request.recoveryCode().isBlank()
                    ? "Successfully Logged In with MFA"
                    : "Successfully Logged In with one-time recovery code");
            return ResponseEntity.ok(Map.of("status", "AUTHENTICATED"));
        } catch (MfaException | MfaChallengeException ex) {
            return failure(ex.getMessage());
        } catch (IllegalStateException ex) {
            // MFA_DECRYPTION_FAILED : le secret TOTP stocke n'est plus
            // dechiffrable (MFA_ENCRYPTION_KEY tournee, ou cle ephemere de dev
            // regeneree au redemarrage). Sans ce catch, l'utilisateur prenait
            // un 500 anonyme et restait verrouille sans explication. On nomme
            // l'etat et la sortie : reinitialisation MFA par un administrateur.
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "MFA_STATE_INVALID",
                    "errorMessage", "Etat MFA illisible (cle de chiffrement changee). "
                            + "Demandez a un administrateur de reinitialiser votre MFA."));
        }
    }

    private ResponseEntity<Map<String, Object>> failure(String code) {
        HttpStatus status = "MFA_CHALLENGE_LOCKED".equals(code)
                ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.UNAUTHORIZED;
        return ResponseEntity.status(status).body(Map.of(
                "errorCode", code,
                "errorMessage", "Verification multifacteur refusee"));
    }

    private void safeAudit(String login, String action) {
        try {
            audit.logAudit(new AuditLogDTO(null, null, login, LocalDateTime.now(), action));
        } catch (Exception ignored) { }
    }
}
