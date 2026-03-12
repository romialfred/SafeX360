package com.minexpert.hns.api;

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

import com.minexpert.hns.dto.parameters.CheckListDTO;
import com.minexpert.hns.dto.response.CheckListDetails;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.CheckListService;

@RestController
@RequestMapping("/check-list")
@CrossOrigin
@Validated
public class CheckListAPI {

    @Autowired
    private CheckListService checkListService;

    @PostMapping("/create")
    public ResponseEntity<Long> createCheckList(@RequestBody CheckListDTO checkListDTO) throws HSException {
        return new ResponseEntity<>(checkListService.addCheckList(checkListDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateCheckList(@RequestBody CheckListDTO checkListDTO) throws HSException {
        checkListService.updateCheckList(checkListDTO);
        return new ResponseEntity<>("Incident Type Updated Successfully", HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CheckListDTO> getCheckListById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(checkListService.getCheckListById(id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activateCheckList(@PathVariable Long id) throws HSException {
        checkListService.activateCheckList(id);
        return new ResponseEntity<>("Incident Type Activated Successfully", HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateCheckList(@PathVariable Long id) throws HSException {
        checkListService.deactivateCheckList(id);
        return new ResponseEntity<>("Incident Type Deactivated Successfully", HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<CheckListDetails>> getAllCheckLists() throws HSException {
        return new ResponseEntity<>(checkListService.getAllCheckLists(), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<CheckListDetails>> getAllActiveCheckLists() throws HSException {
        return new ResponseEntity<>(checkListService.getAllActiveCheckLists(), HttpStatus.OK);
    }
}
