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
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.Jwt.CustomUserDetails;
import com.hrms.Jwt.JwtHelper;
import com.hrms.dto.AuditLogDTO;
import com.hrms.dto.AuthenticationRequest;
import com.hrms.dto.AuthenticationResponse;
import com.hrms.dto.EmployeeDTO;
import com.hrms.service.AuditLogService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthAPI {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtHelper helper;

    @Autowired
    private AuditLogService auditLogService;

    private Logger logger = LoggerFactory.getLogger(AuthAPI.class);

    private static final String SECRET = "80f9762a858c60d6a48a940ffbe1bb2c0af7557c93030805bd10a397d2ae072d77c509aab1bd901f1115e84fb50561d1b61ceb7e99d97f1e785e0b9452e5d874";

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest request,
            HttpServletResponse response) throws Exception {
        String message = "Incorrect username or password";
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getLogin(), request.getPassword()));

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getLogin());
            final String jwt = helper.generateToken(userDetails);
            CustomUserDetails user = (CustomUserDetails) userDetails;
            // FIX LOT 49 : on logge un audit SANS Employee attache pour eviter
            // TransientObjectException quand un compte admin n'a pas d'employee lie.
            // L'identite est tracee via le champ "login" (= username).
            try {
                auditLogService.logAudit(new AuditLogDTO(null, null, request.getLogin(),
                        LocalDateTime.now(), "Successfully Logged In"));
            } catch (Exception auditEx) {
                // L'audit ne doit pas faire echouer le login. On loge mais on continue.
                logger.warn("AuditLog non persiste pour login successful: {}", auditEx.getMessage());
            }
            // LOT 41 P1 SECURITY: max-age cookie aligné sur JWT_EXPIRATION_HOURS (défaut 8h)
            // au lieu de 30 jours, pour limiter la fenêtre d'exploitation d'un vol de cookie.
            // LOT 42 hotfix : SameSite=None obligatoire car frontend (Vercel
             // safex360.data-univers.com) et backend (Render onrender.com) sont
             // sur des registrable-domains différents → cookie cross-site →
             // Lax bloquerait l'envoi du cookie par le navigateur.
            ResponseCookie cookie = ResponseCookie.from("jwt", jwt)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .sameSite("None")
                    .maxAge(Duration.ofMillis(helper.getExpirationMillis()))
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.ok("Login successful");
        } catch (UsernameNotFoundException e) {
            message = "User not found";
            throw new Exception(message, e);
        } catch (BadCredentialsException e) {
            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getLogin());
            CustomUserDetails user = (CustomUserDetails) userDetails;
            if (userDetails == null) {
                auditLogService.logAudit(
                        new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "LoginId not found"));
                throw new UsernameNotFoundException(message);

            } else {
                // FIX LOT 49 : meme correctif que pour le succes — eviter Employee transient
                try {
                    auditLogService.logAudit(
                            new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "Incorrect Password"));
                } catch (Exception auditEx) {
                    logger.warn("AuditLog non persiste pour bad credentials: {}", auditEx.getMessage());
                }
                throw new Exception(message, e);
            }
        } catch (AuthenticationException e) {
            // auditLogService.log(request.getLogin(), action, e.getMessage());
            auditLogService
                    .logAudit(new AuditLogDTO(null, null, request.getLogin(), LocalDateTime.now(), "Internal Error"));

            throw new Exception(message, e);
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

    @GetMapping("/logout")
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
