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

    // R-001 Phase 2.a — Secret extrait du code source
    @org.springframework.beans.factory.annotation.Value("${JWT_SECRET}")
    private String SECRET;

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest request,
            HttpServletResponse response) throws Exception {
        String message = "Incorrect username or password";
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getLogin(), request.getPassword()));

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getLogin());
            final String jwt = helper.generateToken(userDetails);
            EmployeeDTO empDTO = new EmployeeDTO();
            CustomUserDetails user = (CustomUserDetails) userDetails;
            empDTO.setId(user.getEmpId());
            auditLogService.logAudit(new AuditLogDTO(null, user.getEmpId() != null ? empDTO : null, request.getLogin(),
                    LocalDateTime.now(), "Successfully Logged In"));
            ResponseCookie cookie = ResponseCookie.from("jwt", jwt)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .sameSite("Lax")
                    .maxAge(Duration.ofDays(30))
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

                EmployeeDTO empDTO = new EmployeeDTO();
                empDTO.setId(user.getEmpId());
                auditLogService.logAudit(
                        new AuditLogDTO(null, empDTO, request.getLogin(), LocalDateTime.now(), "Incorrect Password"));
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
        ResponseCookie expiredCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
        return ResponseEntity.ok("Logged out");
    }

}
