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
    public ResponseEntity<CommunicationDTO> create(@RequestBody CommunicationDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement : la mine appelante validee prime sur le payload.
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(communicationService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<CommunicationDTO> update(@RequestBody CommunicationDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.update(dto, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<CommunicationDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<CommunicationSummaryView>> getAll(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.getAll(companyId));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<CommunicationSummaryView>> getRecentSummaries(
            @RequestParam(name = "limit", defaultValue = "5") int limit,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.getRecentSummaries(limit, companyId));
    }

    @GetMapping("/stats")
    public ResponseEntity<CommunicationStatsDTO> getCounts(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.getCounts(companyId));
    }

    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<List<CommunicationDTO>> getByDept(@PathVariable Long departmentId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.getByDepartmentId(departmentId, companyId));
    }

    @PutMapping("/schedule/resume/{communicationId}")
    public ResponseEntity<CommunicationDTO> resumeSchedule(@PathVariable Long communicationId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.resumeSchedule(communicationId, companyId));
    }

    @PutMapping("/schedule/pause/{communicationId}")
    public ResponseEntity<CommunicationDTO> pauseSchedule(@PathVariable Long communicationId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.pauseSchedule(communicationId, companyId));
    }

    @PutMapping("/schedule/cancel/{communicationId}")
    public ResponseEntity<CommunicationDTO> cancelSchedule(@PathVariable Long communicationId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.cancelSchedule(communicationId, companyId));
    }

    @PostMapping("/send-now/{communicationId}")
    public ResponseEntity<CommTimeDTO> sendNow(@PathVariable Long communicationId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(communicationService.sendNow(communicationId, companyId));
    }

}
