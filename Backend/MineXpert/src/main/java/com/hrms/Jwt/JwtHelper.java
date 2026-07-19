package com.hrms.Jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtHelper {

    // LOT 41 P1 SECURITY: durée de vie JWT externalisée via JWT_EXPIRATION_HOURS (défaut 8h).
    // L'ancienne constante codée en dur valait 500h (~20 jours) — bien trop long pour un cookie de session.
    @Value("${JWT_EXPIRATION_HOURS:8}")
    private long expirationHours;

    // LOT 52 (SEC-03 complet) : clé de SIGNATURE externalisée — indispensable
    // avant rotation (AuthAPI et le gateway valident avec la même env JWT_SECRET ;
    // un écart signature/validation casserait tous les logins).
    @Value("${JWT_SECRET:}")
    private String SECRET;

    // LOT 41 P1 SECURITY: durée de vie effective du JWT en millisecondes.
    // Exposée pour que les couches API (cookie max-age) et JWT (setExpiration) restent cohérentes.
    public long getExpirationMillis() {
        if (expirationHours < 1 || expirationHours > 24) {
            throw new IllegalStateException("JWT_EXPIRATION_HOURS doit être compris entre 1 et 24");
        }
        return Math.multiplyExact(expirationHours, 60L * 60L * 1000L);
    }

    // retrieve username from jwt token
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    // retrieve expiration date from jwt token
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    // for retrieveing any information from token we will need the secret key
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token).getBody();
    }

    // check if the token has expired
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    // generate token for user
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        CustomUserDetails user = (CustomUserDetails) userDetails;
        claims.put("id", user.getId());
        claims.put("name", user.getName());
        claims.put("firstLogin", user.getFirstLogin());
        claims.put("empId", user.getEmpId());
        claims.put("empNumber", user.getEmpNumber());
        claims.put("company", user.getCompanyId());
        claims.put("workingCompanyId", user.getWorkingCompanyId());
        claims.put("departmentId", user.getDepartmentId());
        claims.put("role", user.getRole());
        claims.put("teamId", user.getTeamId());
        // Périmètre multi-mines (cloisonnement strict) : injecté dans le JWT pour
        // que le gateway le propage (X-User-Companies / X-All-Mines) et que HNS
        // valide chaque companyId demandé. `companies` = CSV des ids autorisés.
        claims.put("allMines", Boolean.TRUE.equals(user.getAllMinesAccess()));
        claims.put("companies", user.getAssignedCompaniesCsv() != null ? user.getAssignedCompaniesCsv() : "");
        return doGenerateToken(claims, userDetails.getUsername());
    }

    // while creating the token -
    // 1. Define claims of the token, like Issuer, Expiration, Subject, and the ID
    // 2. Sign the JWT using the HS512 algorithm and secret key.
    // 3. According to JWS Compact
    // Serialization(https://tools.ietf.org/html/draft-ietf-jose-json-web-signature-41#section-3.1)
    // compaction of the JWT to a URL-safe string
    private String doGenerateToken(Map<String, Object> claims, String subject) {

        // LOT 41 P1 SECURITY: utilise getExpirationMillis() basé sur JWT_EXPIRATION_HOURS
        return Jwts.builder().setClaims(claims).setSubject(subject).setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + getExpirationMillis()))
                .signWith(SignatureAlgorithm.HS512, SECRET).compact();
    }

    // validate token
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

}
