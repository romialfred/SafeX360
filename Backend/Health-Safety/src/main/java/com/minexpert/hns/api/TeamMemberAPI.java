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
    public ResponseEntity<Long> addTeamMember(@RequestParam Long companyId, @RequestBody TeamMemberDTO teamMemberDTO)
            throws HSException {
        return new ResponseEntity<>(teamMemberService.addTeamMember(companyId, teamMemberDTO),
                HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateTeamMember(@RequestParam(required = false) Long companyId,
            @RequestBody TeamMemberDTO teamMemberDTO) throws HSException {
        teamMemberService.updateTeamMember(companyId, teamMemberDTO);
        return new ResponseEntity<>(new ResponseDTO("Team Member updated successfully."),
                HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteTeamMember(@RequestParam(required = false) Long companyId, @PathVariable Long id)
            throws HSException {
        teamMemberService.deleteTeamMember(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Team Member deleted successfully."),
                HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<TeamMemberDTO>> getAllTeamMembers(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(teamMemberService.getAllTeamMembers(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<TeamMemberDTO>> getAllActiveTeamMembers(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(teamMemberService.getAllActiveTeamMembers(companyId), HttpStatus.OK);
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<TeamMemberDTO> getTeamMemberByEmployeeId(@RequestParam Long companyId,
            @PathVariable Long employeeId) throws HSException {
        return new ResponseEntity<>(teamMemberService.getTeamMemberByEmployeeId(companyId, employeeId),
                HttpStatus.OK);
    }

    @PutMapping("/activate")
    public ResponseEntity<ResponseDTO> activateTeamMember(@RequestParam(required = false) Long companyId, @RequestBody Long id)
            throws HSException {
        teamMemberService.activateTeamMember(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Team Member activated successfully."),
                HttpStatus.OK);
    }

    @PutMapping("/deactivate")
    public ResponseEntity<ResponseDTO> deactivateTeamMember(@RequestParam(required = false) Long companyId, @RequestBody Long id)
            throws HSException {
        teamMemberService.deactivateTeamMember(companyId, id);
        return new ResponseEntity<>(new ResponseDTO("Team Member deactivated successfully."),
                HttpStatus.OK);
    }
}
