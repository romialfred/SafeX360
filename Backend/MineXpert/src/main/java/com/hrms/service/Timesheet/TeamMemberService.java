package com.hrms.service.Timesheet;

import java.util.List;

import com.hrms.DataInterface.TeamMemberDetails;
import com.hrms.dto.Timesheet.TeamMemberDTO;
import com.hrms.exception.HRMSException;

public interface TeamMemberService {
    public TeamMemberDTO addTeamMember(TeamMemberDTO teamMemberDTO) throws HRMSException;

    public void updateTeamMember(TeamMemberDTO teamMemberDTO) throws HRMSException;

    public void activateTeamMember(Long id) throws HRMSException;

    public void deactivateTeamMember(Long id) throws HRMSException;

    public List<TeamMemberDetails> getTeamMembers(Long teamId) throws HRMSException;

}
