package com.minexpert.hns.api;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.inspections.InspectionReportDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.inspections.InspectionReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/inspection-reports")
@CrossOrigin
@RequiredArgsConstructor
public class InspectionReportController {

    private final InspectionReportService inspectionReportService;

    @PostMapping("/create")
    public ResponseEntity<Long> createReport(@RequestBody InspectionReportDTO report) throws HSException {
        Long reportId = inspectionReportService.createReport(report);
        return ResponseEntity.status(201).body(reportId);
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<InspectionReportDTO> getReportById(@PathVariable Long id) throws HSException {
        InspectionReportDTO report = inspectionReportService.findById(id);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/getByInspection/{inspectionId}")
    public ResponseEntity<InspectionReportDTO> getReportByGeneralInspectionId(@PathVariable Long inspectionId)
            throws HSException {
        InspectionReportDTO report = inspectionReportService.findByGeneralInspectionId(inspectionId);
        return ResponseEntity.ok(report);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateReport(@RequestBody InspectionReportDTO report) throws HSException {
        inspectionReportService.updateReport(report);
        return new ResponseEntity<>(new ResponseDTO("Report updated successfully."), HttpStatus.OK);
    }

}
