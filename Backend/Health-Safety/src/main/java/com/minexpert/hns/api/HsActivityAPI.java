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

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.activities.HsActivityDTO;
import com.minexpert.hns.dto.activities.HsActivityDetails;
import com.minexpert.hns.dto.activities.HsActivityResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.activities.HsActivityService;

@RestController
@RequestMapping("/hs-activity")
@CrossOrigin
@Validated
public class HsActivityAPI {

    @Autowired
    private HsActivityService hsActivityService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createActivity(@RequestBody HsActivityDTO hsActivityDTO) throws HSException {
        hsActivityService.createActivity(hsActivityDTO);
        return new ResponseEntity<>(new ResponseDTO("Activity created successfully."), HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateActivity(@RequestBody HsActivityDTO hsActivityDTO,
            @RequestParam(required = false) Long companyId) throws HSException {
        hsActivityService.updateActivity(hsActivityDTO, companyId);
        return new ResponseEntity<>(new ResponseDTO("Activity updated successfully."), HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<HsActivityResponse>> getAllActivities(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(hsActivityService.getAllActivities(companyId), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<HsActivityDetails> getActivityById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(hsActivityService.getActivityDetails(id, companyId), HttpStatus.OK);
    }

    @GetMapping("/getInfo/{id}")
    public ResponseEntity<HsActivityResponse> getActivityInfoById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(hsActivityService.getActivityInfo(id, companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllMeetings")
    public ResponseEntity<List<HsActivityResponse>> getAllMeetings(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(hsActivityService.getAllMeetings(companyId), HttpStatus.OK);
    }

    @GetMapping("/getAllTours")
    public ResponseEntity<List<HsActivityResponse>> getAllTours(
            @RequestParam(required = false) Long companyId) throws HSException {
        return new ResponseEntity<>(hsActivityService.getAllTours(companyId), HttpStatus.OK);
    }
}
