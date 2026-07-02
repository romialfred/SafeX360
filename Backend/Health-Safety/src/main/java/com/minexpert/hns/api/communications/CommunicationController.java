package com.minexpert.hns.api.communications;

import com.minexpert.hns.dto.communications.CommTimeDTO;
import com.minexpert.hns.dto.communications.CommunicationDTO;
import com.minexpert.hns.dto.communications.CommunicationStatsDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.projection.CommunicationSummaryView;
import com.minexpert.hns.service.communications.CommunicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/communications")
@RequiredArgsConstructor
public class CommunicationController {
    private final CommunicationService communicationService;

    @PostMapping("/create")
    public ResponseEntity<CommunicationDTO> create(@RequestBody CommunicationDTO dto) throws HSException {
        return ResponseEntity.ok(communicationService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<CommunicationDTO> update(@RequestBody CommunicationDTO dto) throws HSException {
        return ResponseEntity.ok(communicationService.update(dto));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CommunicationDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(communicationService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<CommunicationSummaryView>> getAll() throws HSException {
        return ResponseEntity.ok(communicationService.getAll());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<CommunicationSummaryView>> getRecentSummaries(
            @RequestParam(name = "limit", defaultValue = "5") int limit) throws HSException {
        return ResponseEntity.ok(communicationService.getRecentSummaries(limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<CommunicationStatsDTO> getCounts() throws HSException {
        return ResponseEntity.ok(communicationService.getCounts());
    }

    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<List<CommunicationDTO>> getByDept(@PathVariable Long departmentId) throws HSException {
        return ResponseEntity.ok(communicationService.getByDepartmentId(departmentId));
    }

    @PutMapping("/schedule/resume/{communicationId}")
    public ResponseEntity<CommunicationDTO> resumeSchedule(@PathVariable Long communicationId) throws HSException {
        return ResponseEntity.ok(communicationService.resumeSchedule(communicationId));
    }

    @PutMapping("/schedule/pause/{communicationId}")
    public ResponseEntity<CommunicationDTO> pauseSchedule(@PathVariable Long communicationId) throws HSException {
        return ResponseEntity.ok(communicationService.pauseSchedule(communicationId));
    }

    @PutMapping("/schedule/cancel/{communicationId}")
    public ResponseEntity<CommunicationDTO> cancelSchedule(@PathVariable Long communicationId) throws HSException {
        return ResponseEntity.ok(communicationService.cancelSchedule(communicationId));
    }

    @PostMapping("/send-now/{communicationId}")
    public ResponseEntity<CommTimeDTO> sendNow(@PathVariable Long communicationId) throws HSException {
        return ResponseEntity.ok(communicationService.sendNow(communicationId));
    }

}
