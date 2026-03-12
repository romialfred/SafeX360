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
import com.minexpert.hns.dto.parameters.TeamMemberDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.TeamMemberService;

@RestController
@RequestMapping("/team-member")
@CrossOrigin
@Validated
public class TeamMemberAPI {

    @Autowired
    private TeamMemberService teamMemberService;

    @PostMapping("/add")
    public ResponseEntity<Long> addTeamMember(@RequestBody TeamMemberDTO teamMemberDTO) throws HSException {
        return new ResponseEntity<>(teamMemberService.addTeamMember(teamMemberDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateTeamMember(@RequestBody TeamMemberDTO teamMemberDTO) throws HSException {
        teamMemberService.updateTeamMember(teamMemberDTO);
        return new ResponseEntity<>(new ResponseDTO("Team Member updated successfully."),
                HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteTeamMember(@PathVariable Long id) throws HSException {
        teamMemberService.deleteTeamMember(id);
        return new ResponseEntity<>(new ResponseDTO("Team Member deleted successfully."),
                HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<TeamMemberDTO>> getAllTeamMembers() throws HSException {
        return new ResponseEntity<>(teamMemberService.getAllTeamMembers(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<TeamMemberDTO>> getAllActiveTeamMembers() throws HSException {
        return new ResponseEntity<>(teamMemberService.getAllActiveTeamMembers(), HttpStatus.OK);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<TeamMemberDTO> getTeamMemberByEmployeeId(@PathVariable Long employeeId) throws HSException {
        return new ResponseEntity<>(teamMemberService.getTeamMemberByEmployeeId(employeeId), HttpStatus.OK);
    }

    @PutMapping("/activate")
    public ResponseEntity<ResponseDTO> activateTeamMember(@RequestBody Long id) throws HSException {
        teamMemberService.activateTeamMember(id);
        return new ResponseEntity<>(new ResponseDTO("Team Member activated successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/deactivate")
    public ResponseEntity<ResponseDTO> deactivateTeamMember(@RequestBody Long id) throws HSException {
        teamMemberService.deactivateTeamMember(id);
        return new ResponseEntity<>(new ResponseDTO("Team Member deactivated successfully."),
                HttpStatus.OK);
    }
}
