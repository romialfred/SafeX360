package com.hrms.Jwt;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collection;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomUserDetails implements UserDetails {

    private Long id;
    private String username;
    private String password;
    private String name;
    private Boolean firstLogin;
    private Long empId;
    private String empNumber;
    private Long companyId;
    private Long workingCompanyId;
    private Long departmentId;
    private String role;
    private Long teamId;
    private Collection<? extends GrantedAuthority> authorities;
    /** Accès à toutes les mines (vue consolidée) — cloisonnement strict. */
    private Boolean allMinesAccess;
    /** CSV des ids de mines assignées (périmètre autorisé ; vide si allMinesAccess). */
    private String assignedCompaniesCsv;

}
