package com.hrms.api.Timesheet;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.DataInterface.EmployeeNameDTO;
import com.hrms.DataInterface.TeamManagerDetails;
import com.hrms.DataInterface.TeamRoleDetails;
import com.hrms.dto.ResponseDTO;
import com.hrms.dto.Timesheet.TeamManagerDTO;
import com.hrms.enums.Role;
import com.hrms.exception.HRMSException;
import com.hrms.service.Timesheet.TeamManagerService;

@RestController
@RequestMapping("/teamManager")
@CrossOrigin
@Validated
public class TeamManagerAPI {
    @Autowired
    private TeamManagerService teamManagerService;

    @PostMapping("/addManager")
    public ResponseEntity<TeamManagerDTO> addTeamManager(@RequestBody TeamManagerDTO teamManagerDTO)
            throws HRMSException {

        return new ResponseEntity<>(teamManagerService.addTeamManager(teamManagerDTO), HttpStatus.CREATED);
    }

    @GetMapping("/getManagers/{teamId}")
    public ResponseEntity<List<TeamManagerDetails>> getTeamManagers(@PathVariable Long teamId) throws HRMSException {
        return new ResponseEntity<>(teamManagerService.getTeamManagers(teamId), HttpStatus.OK);
    }

    @GetMapping("/getManagersWithEmail/{teamId}")
    public ResponseEntity<List<TeamManagerDetails>> getTeamManagersWithEmail(@PathVariable Long teamId)
            throws HRMSException {
        return new ResponseEntity<>(teamManagerService.getTeamManagersWithEmail(teamId), HttpStatus.OK);
    }

    @GetMapping("/getActiveManagers/{teamId}")
    public ResponseEntity<List<TeamManagerDetails>> getActiveTeamManagers(@PathVariable Long teamId)
            throws HRMSException {
        return new ResponseEntity<>(teamManagerService.getActiveTeamManagers(teamId), HttpStatus.OK);
    }

    @PutMapping("/activateManager/{teamManagerId}")
    public ResponseEntity<ResponseDTO> activateTeamManager(@PathVariable Long teamManagerId) throws HRMSException {
        teamManagerService.activateTeamManager(teamManagerId);
        return new ResponseEntity<>(new ResponseDTO("Team Manager activated successfully"), HttpStatus.OK);
    }

    @PutMapping("/deactivateManager/{teamManagerId}")
    public ResponseEntity<ResponseDTO> deactivateTeamManager(@PathVariable Long teamManagerId) throws HRMSException {
        teamManagerService.deactivateTeamManager(teamManagerId);
        return new ResponseEntity<>(new ResponseDTO("Team Manager deactivated successfully"), HttpStatus.OK);
    }

    @GetMapping("/getAvailableRoles/{id}")
    public ResponseEntity<List<Role>> getAvailableRoles(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(teamManagerService.getAvailableRoles(id), HttpStatus.OK);
    }

    @GetMapping("/getEligibleManagersForTeam/{departmentId}/{teamId}")
    public ResponseEntity<List<EmployeeNameDTO>> getEligibleManagerForTeam(@PathVariable Long departmentId,
            @PathVariable Long teamId) throws HRMSException {
        return new ResponseEntity<>(teamManagerService.getEligibleManagersForTeam(departmentId, teamId), HttpStatus.OK);
    }

    @GetMapping("/getEligibleApproversForTeam/{companyId}/{teamId}")
    public ResponseEntity<List<EmployeeNameDTO>> getEligibleApproversForTeam(@PathVariable Long companyId,
            @PathVariable Long teamId) throws HRMSException {
        return new ResponseEntity<>(teamManagerService.getEligibleApproverForTeam(companyId, teamId), HttpStatus.OK);
    }

    @GetMapping("/getTeamRoleDetails/{id}")
    public ResponseEntity<List<TeamRoleDetails>> getTeamRoleDetails(@PathVariable Long id) {
        return new ResponseEntity<>(teamManagerService.getTeamRoleDetails(id), HttpStatus.OK);
    }
}
