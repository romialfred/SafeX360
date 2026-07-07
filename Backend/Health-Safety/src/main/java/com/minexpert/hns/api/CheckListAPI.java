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
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<Long> createCheckList(@RequestParam Long companyId, @RequestBody CheckListDTO checkListDTO)
            throws HSException {
        return new ResponseEntity<>(checkListService.addCheckList(companyId, checkListDTO), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateCheckList(@RequestParam Long companyId,
            @RequestBody CheckListDTO checkListDTO) throws HSException {
        checkListService.updateCheckList(companyId, checkListDTO);
        return new ResponseEntity<>("CheckList Updated Successfully", HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CheckListDTO> getCheckListById(@RequestParam(required = false) Long companyId,
            @PathVariable Long id) throws HSException {
        return new ResponseEntity<>(checkListService.getCheckListById(companyId, id), HttpStatus.OK);
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<String> activateCheckList(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        checkListService.activateCheckList(companyId, id);
        return new ResponseEntity<>("CheckList Activated Successfully", HttpStatus.OK);
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateCheckList(@RequestParam Long companyId, @PathVariable Long id)
            throws HSException {
        checkListService.deactivateCheckList(companyId, id);
        return new ResponseEntity<>("CheckList Deactivated Successfully", HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<CheckListDetails>> getAllCheckLists(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(checkListService.getAllCheckLists(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllActive")
    public ResponseEntity<List<CheckListDetails>> getAllActiveCheckLists(@RequestParam(required = false) Long companyId)
            throws HSException {
        return new ResponseEntity<>(checkListService.getAllActiveCheckLists(companyId), HttpStatus.OK);
    }
}
