package com.hrms.api;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.RosterDTO;
import com.hrms.dto.ResponseDTO;
import com.hrms.dto.RosterDTO;
import com.hrms.exception.HRMSException;
import com.hrms.service.RosterService;

@RestController
@CrossOrigin
@RequestMapping("/roster")
@Validated
public class RosterAPI {
    @Autowired
    private RosterService rosterService;

    @PostMapping("/add")
    public ResponseEntity<ResponseDTO> addRoster(@RequestBody RosterDTO rosterDTO) throws HRMSException {
        rosterService.addRoster(rosterDTO);
        return new ResponseEntity<>(new ResponseDTO("Roster added Successfully."), HttpStatus.CREATED);
    }
    @PostMapping("/update")
    public ResponseEntity<ResponseDTO> updateRoster(@RequestBody RosterDTO rosterDTO) throws HRMSException {
        rosterService.updateRoster(rosterDTO);
        return new ResponseEntity<>(new ResponseDTO("Roster updated Successfully."), HttpStatus.OK);
    }
 @GetMapping("/get/{id}")
    public ResponseEntity<RosterDTO> getRoster(@PathVariable Long id) throws HRMSException {
        return new ResponseEntity<>(rosterService.getRoster(id), HttpStatus.OK);
    }
    @GetMapping("/getAll")
    public ResponseEntity<List<RosterDTO>> getAllRosters() {
        return new ResponseEntity<>(rosterService.getAllRosters(), HttpStatus.OK);
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteRoster(@PathVariable Long id) throws HRMSException {
        rosterService.deleteRoster(id);
        return new ResponseEntity<>(new ResponseDTO("Roster deleted Successfully."), HttpStatus.OK);
    }
    
}
