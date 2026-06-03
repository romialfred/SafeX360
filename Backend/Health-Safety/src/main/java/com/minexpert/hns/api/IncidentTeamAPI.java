package com.minexpert.hns.api;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.parameters.IncidentTeamDTO;
import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.dto.parameters.TeamRequest;
import com.minexpert.hns.dto.parameters.TeamResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.IncidentTeamService;
import com.minexpert.hns.service.parameters.TeamMemberService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/incident-team")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class IncidentTeamAPI {

    private final IncidentTeamService incidentTeamService;
    private final TeamMemberService teamMemberService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createIncidentTeam(@RequestParam Long companyId,
            @RequestBody TeamRequest teamRequest)
            throws HSException {
        teamRequest.setCompanyId(companyId);
        incidentTeamService.addIncidentTeam(companyId, teamRequest);
        return new ResponseEntity<>(new ResponseDTO("Incident Team created successfully."), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncidentTeam(@RequestParam Long companyId,
            @RequestBody TeamRequest teamRequest)
            throws HSException {
        teamRequest.setCompanyId(companyId);
        incidentTeamService.updateIncidentTeam(companyId, teamRequest);
        return new ResponseEntity<>(new ResponseDTO("Incident Team updated successfully."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteIncidentTeam(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        incidentTeamService.deleteIncidentTeam(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Team deleted successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentTeamDTO>> getAllIncidentTeams(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(incidentTeamService.getAllIncidentTeams(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<IncidentTeamDTO>> getAllActiveIncidentTeams(
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(incidentTeamService.getAllActiveIncidentTeams(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentTeamDTO> getIncidentTeamById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentTeamService.getIncidentTeamById(companyId, id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateIncidentTeam(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        incidentTeamService.activateIncidentTeam(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Team activated successfully."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateIncidentTeam(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        incidentTeamService.deactivateIncidentTeam(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Incident Team deactivated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getTeamMembers/{teamId}")
    public ResponseEntity<List<TeamMemberDTO>> getTeamMembersByTeam(@RequestParam(required = false) Long companyId,
            @PathVariable Long teamId) throws HSException {
        return new ResponseEntity<>(teamMemberService.getTeamMemberByTeam(companyId, teamId), HttpStatus.OK);
    }

    @DeleteMapping("/removeMember/{id}")
    public ResponseEntity<ResponseDTO> removeMember(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        teamMemberService.deleteTeamMember(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Team member removed successfully."), HttpStatus.OK);
    }

    @GetMapping("/getTeamDetails/{id}")
    public ResponseEntity<TeamResponse> getTeamDetailsById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentTeamService.getTeamDetailsById(companyId, id), HttpStatus.OK);
    }

    /**
     * Checks whether the supplied employee belongs to an active incident team and,
     * if so, returns the team definition along with every member assigned to that
     * team. Throws {@link HSException} when the employee is not registered as an
     * active team member.
     */
    @GetMapping("/member/team-details/{employeeId}")
    public ResponseEntity<TeamResponse> getTeamDetailsByMember(@RequestParam Long companyId,
            @PathVariable Long employeeId) throws HSException {
        return ResponseEntity.ok(teamMemberService.getActiveTeamDetailsByEmployeeId(companyId, employeeId));
    }

}
