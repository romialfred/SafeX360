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
    public ResponseEntity<ResponseDTO> createIncidentTeam(@RequestBody TeamRequest teamRequest)
            throws HSException {
        incidentTeamService.addIncidentTeam(teamRequest);
        return new ResponseEntity<>(new ResponseDTO("Incident Team created successfully."), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateIncidentTeam(@RequestBody TeamRequest teamRequest)
            throws HSException {
        incidentTeamService.updateIncidentTeam(teamRequest);
        return new ResponseEntity<>(new ResponseDTO("Incident Team updated successfully."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteIncidentTeam(@PathVariable Long id) throws HSException {
        incidentTeamService.deleteIncidentTeam(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Team deleted successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<IncidentTeamDTO>> getAllIncidentTeams() throws HSException {
        return new ResponseEntity<>(incidentTeamService.getAllIncidentTeams(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<IncidentTeamDTO>> getAllActiveIncidentTeams() throws HSException {
        return new ResponseEntity<>(incidentTeamService.getAllActiveIncidentTeams(), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<IncidentTeamDTO> getIncidentTeamById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentTeamService.getIncidentTeamById(id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateIncidentTeam(@PathVariable Long id) throws HSException {
        incidentTeamService.activateIncidentTeam(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Team activated successfully."), HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateIncidentTeam(@PathVariable Long id) throws HSException {
        incidentTeamService.deactivateIncidentTeam(id);
        return new ResponseEntity<>(new ResponseDTO("Incident Team deactivated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getTeamMembers/{teamId}")
    public ResponseEntity<List<TeamMemberDTO>> getTeamMembersByTeam(@PathVariable Long teamId) throws HSException {
        return new ResponseEntity<>(teamMemberService.getTeamMemberByTeam(teamId), HttpStatus.OK);
    }

    @DeleteMapping("/removeMember/{id}")
    public ResponseEntity<ResponseDTO> removeMember(@PathVariable Long id) {
        teamMemberService.deleteTeamMember(id);
        return new ResponseEntity<>(new ResponseDTO("Team member removed successfully."), HttpStatus.OK);
    }

    @GetMapping("/getTeamDetails/{id}")
    public ResponseEntity<TeamResponse> getTeamDetailsById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(incidentTeamService.getTeamDetailsById(id), HttpStatus.OK);
    }

    /**
     * Checks whether the supplied employee belongs to an active incident team and,
     * if so, returns the team definition along with every member assigned to that
     * team. Throws {@link HSException} when the employee is not registered as an
     * active team member.
     */
    @GetMapping("/member/team-details/{employeeId}")
    public ResponseEntity<TeamResponse> getTeamDetailsByMember(@PathVariable Long employeeId) throws HSException {
        return ResponseEntity.ok(teamMemberService.getActiveTeamDetailsByEmployeeId(employeeId));
    }

}
