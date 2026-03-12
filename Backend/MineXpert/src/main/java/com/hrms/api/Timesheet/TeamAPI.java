package com.hrms.api.Timesheet;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.TeamDetails;
import com.hrms.DataInterface.TeamMemberDetails;
import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.TeamDTO;
import com.hrms.dto.Timesheet.TeamMemberDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.TeamMemberService;
import com.hrms.service.Timesheet.TeamService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/teams")
@CrossOrigin
@Validated
public class TeamAPI {

    @Autowired
    private TeamService teamService;

    @Autowired
    private TeamMemberService teamMemberService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createTeam(@RequestBody TeamDTO teamDTO) throws HRMSException {
        teamService.createTeam(teamDTO);
        return new ResponseEntity<>(new ResponseDTO("Team created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateTeam(@RequestBody TeamDTO teamDTO) throws HRMSException {
        teamService.updateTeam(teamDTO);
        return new ResponseEntity<>(new ResponseDTO("Team updated successfully"), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<TeamDetails> getTeam(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(teamService.getTeam(id), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<TeamDetails>> getAllTeams() throws HRMSException {
        return new ResponseEntity<>(teamService.getAllTeams(), HttpStatus.OK);
    }

    @PostMapping("/addMember")
    public ResponseEntity<TeamMemberDTO> addTeamMember(@RequestBody TeamMemberDTO teamMemberDTO) throws HRMSException {

        return new ResponseEntity<>(teamMemberService.addTeamMember(teamMemberDTO), HttpStatus.CREATED);
    }

    @PutMapping("/updateMember")
    public ResponseEntity<ResponseDTO> updateTeamMember(@RequestBody TeamMemberDTO teamMemberDTO) throws HRMSException {
        teamMemberService.updateTeamMember(teamMemberDTO);

        return new ResponseEntity<>(new ResponseDTO("Team member updated successfully"), HttpStatus.OK);
    }

    @PutMapping("/activateMember/{teamMemberId}")
    public ResponseEntity<ResponseDTO> activateTeamMember(@PathVariable Long teamMemberId) throws HRMSException {
        teamMemberService.activateTeamMember(teamMemberId);
        return new ResponseEntity<>(new ResponseDTO("Team member activated successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivateMember/{teamMemberId}")
    public ResponseEntity<ResponseDTO> deactivateTeamMember(@PathVariable Long teamMemberId) throws HRMSException {
        teamMemberService.deactivateTeamMember(teamMemberId);
        return new ResponseEntity<>(new ResponseDTO("Team member deactivated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getMembers/{teamId}")
    public ResponseEntity<List<TeamMemberDetails>> getTeamMembers(@PathVariable Long teamId) throws HRMSException {
        return new ResponseEntity<>(teamMemberService.getTeamMembers(teamId), HttpStatus.OK);
    }

    @GetMapping("/getEligibleEmployees/{departmentId}/{teamId}")
    public ResponseEntity<List<EmployeeNameDTO>> getEligibleEmployeesForTeam(@PathVariable Long departmentId,
            @PathVariable Long teamId)
            throws HRMSException {
        return new ResponseEntity<>(teamService.getEligibleEmployeesForTeam(departmentId, teamId), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteTeam(@PathVariable Long id) throws HRMSException {
        teamService.deleteTeam(id);
        return new ResponseEntity<>(new ResponseDTO("Team Closed successfully"), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateTeam(@PathVariable Long id) throws HRMSException {
        teamService.activateTeam(id);
        return new ResponseEntity<>(new ResponseDTO("Team activated successfully"), HttpStatus.OK);
    }

}
