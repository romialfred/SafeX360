package com.minexpert.hns.api;

import com.minexpert.hns.dto.HsActivityHistoryDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.activities.HsActivityHistoryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hs-activity-history")
@RequiredArgsConstructor
@CrossOrigin
public class HsActivityHistoryController {
    private final HsActivityHistoryService hsActivityHistoryService;

    @PostMapping("/create")
    public ResponseEntity<Long> create(@RequestBody HsActivityHistoryDTO dto) throws HSException {
        return ResponseEntity.ok(hsActivityHistoryService.saveHsActivityHistory(dto));
    }

    @GetMapping("/get/{hsActivityId}")
    public ResponseEntity<List<HsActivityHistoryDTO>> getByHsActivityId(@PathVariable Long hsActivityId)
            throws HSException {
        return ResponseEntity.ok(hsActivityHistoryService.getHsActivityHistoryByHsActivityId(hsActivityId));
    }
}
