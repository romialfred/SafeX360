package com.minexpert.hns.api;

import com.minexpert.hns.dto.inspections.InspectionHistoryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.inspections.InspectionHistoryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inspection-history")
@RequiredArgsConstructor
@CrossOrigin
public class InspectionHistoryController {
    private final InspectionHistoryService inspectionHistoryService;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestBody InspectionHistoryDTO dto) throws HSException {
        return ResponseEntity.ok(inspectionHistoryService.saveInspectionHistory(dto));
    }

    @GetMapping("/get/{inspectionId}")
    public ResponseEntity<List<InspectionHistoryDTO>> getByInspectionId(@PathVariable Long inspectionId)
            throws HSException {
        return ResponseEntity.ok(inspectionHistoryService.getInspectionHistoryByInspectionId(inspectionId));
    }
}
