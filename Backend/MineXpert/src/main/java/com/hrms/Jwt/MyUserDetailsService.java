package com.hrms.Jwt;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hrms.dto.AccountDTO;
import com.hrms.repository.Timesheet.TeamMemberRepository;
import com.hrms.service.AccountService;

@Service
public class MyUserDetailsService implements UserDetailsService {
    @Autowired
    private AccountService accountService;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

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
                    new ArrayList<>());
        } catch (Exception e) {
            throw new UsernameNotFoundException("Database access error: " + e.getMessage());
        }
    }

}
