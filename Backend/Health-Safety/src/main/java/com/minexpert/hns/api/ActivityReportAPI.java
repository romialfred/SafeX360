package com.minexpert.hns.api;

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
import com.minexpert.hns.dto.activities.ActivityReportDTO;
import com.minexpert.hns.dto.activities.ActivityReportRequest;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.activities.ActivityReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/activity-report")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class ActivityReportAPI {
    private final ActivityReportService activityReportService;

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO> createActivityReport(@RequestBody ActivityReportRequest request)
            throws HSException {
        activityReportService.addActivityReport(request);
        return new ResponseEntity<>(new ResponseDTO("Activity Report created successfully."), HttpStatus.CREATED);
    }

    @PostMapping("/createDTO")
    public ResponseEntity<Long> createActivityReport(@RequestBody ActivityReportDTO activityReportDTO)
            throws HSException {
        Long id = activityReportService.addActivityReport(activityReportDTO);
        return new ResponseEntity<>(id, HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateActivityReport(@RequestBody ActivityReportDTO activityReportDTO)
            throws HSException {
        activityReportService.updateActivityReport(activityReportDTO);
        return new ResponseEntity<>(new ResponseDTO("Activity Report updated successfully."), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ResponseDTO> deleteActivityReport(@PathVariable Long id) throws HSException {
        activityReportService.deleteActivityReport(id);
        return new ResponseEntity<>(new ResponseDTO("Activity Report deleted successfully."), HttpStatus.OK);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ActivityReportDTO> getActivityReportById(@PathVariable Long id) throws HSException {
        return new ResponseEntity<>(activityReportService.getActivityReportById(id), HttpStatus.OK);
    }

    @GetMapping("/getByActivityId/{activityId}")
    public ResponseEntity<ActivityReportDTO> getActivityReportByActivityId(@PathVariable Long activityId)
            throws HSException {
        return new ResponseEntity<>(activityReportService.getActivityReportByActivityId(activityId), HttpStatus.OK);
    }

}
