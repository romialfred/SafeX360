package com.hrms.Jwt;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hrms.dto.AccountDTO;
import com.hrms.entity.Account;
import com.hrms.repository.AccountRepository;
import com.hrms.repository.Timesheet.TeamMemberRepository;
import com.hrms.service.AccountService;

@Service
public class MyUserDetailsService implements UserDetailsService {
    @Autowired
    private AccountService accountService;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {

        try {
            AccountDTO dto = accountService.getAccountByLogin(login);
            if (dto == null) {
                throw new UsernameNotFoundException("User not found with login: " + login);
            }
            Long teamId = dto.getEmployee() != null
                    ? teamMemberRepository.findTeamId(dto.getEmployee().getId()).orElse(null)
                    : null;

            // Périmètre multi-mines (cloisonnement strict) chargé depuis l'entité :
            // allMinesAccess + CSV des ids de mines assignées → portés dans le JWT.
            Account acc = accountRepository.findByLogin(login).orElse(null);
            boolean allMines = acc != null && Boolean.TRUE.equals(acc.getAllMinesAccess());
            String assignedCsv = "";
            if (acc != null && acc.getAssignedCompanies() != null && !acc.getAssignedCompanies().isEmpty()) {
                java.util.List<String> ids = new ArrayList<>();
                acc.getAssignedCompanies().forEach(c -> { if (c != null && c.getId() != null) ids.add(String.valueOf(c.getId())); });
                assignedCsv = String.join(",", ids);
            } else if (acc != null && acc.getCompany() != null && acc.getCompany().getId() != null) {
                // Repli : compte non migré → sa mine principale forme le périmètre.
                assignedCsv = String.valueOf(acc.getCompany().getId());
            }

            return new CustomUserDetails(dto.getId(), login, dto.getPassword(),
                    dto.getEmployee() != null
                            ? dto.getEmployee().getFirstName() + " " + dto.getEmployee().getFamilyName()
                            : dto.getName(),
                    dto.getFirstLogin(),
                    dto.getEmployee() != null ? dto.getEmployee().getId() : null,
                    dto.getEmployee() != null ? dto.getEmployee().getUniqueNumber() : null,
                    dto.getCompany() != null ? dto.getCompany().getId() : null,
                    dto.getEmployee() != null ? dto.getEmployee().getCompany().getId() : null,
                    dto.getDepartment() != null ? dto.getDepartment().getId() : null, dto.getRole(),
                    teamId,
                    new ArrayList<>(),
                    allMines,
                    assignedCsv);
        } catch (Exception e) {
            throw new UsernameNotFoundException("Database access error: " + e.getMessage());
        }
    }

}
