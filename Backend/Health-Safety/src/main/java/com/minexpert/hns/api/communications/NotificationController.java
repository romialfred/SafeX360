package com.minexpert.hns.api.communications;

import com.minexpert.hns.dto.communications.NotificationDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.communications.projection.NotificationSummaryView;
import com.minexpert.hns.service.communications.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @PostMapping("/create")
    public ResponseEntity<NotificationDTO> create(@RequestBody NotificationDTO dto) throws HSException {
        return ResponseEntity.ok(notificationService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<NotificationDTO> update(@RequestBody NotificationDTO dto) throws HSException {
        return ResponseEntity.ok(notificationService.update(dto));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<NotificationDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(notificationService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<NotificationSummaryView>> getAll(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(notificationService.getAll(companyId));
    }

    @GetMapping
    public ResponseEntity<List<NotificationSummaryView>> list(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(notificationService.getAll(companyId));
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<NotificationDTO>> getActive(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(notificationService.getActive(companyId));
    }

    @GetMapping("/getExpired")
    public ResponseEntity<List<NotificationDTO>> getExpired(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(notificationService.getExpired(companyId));
    }

    @GetMapping("/communication/{communicationId}")
    public ResponseEntity<List<NotificationDTO>> getByCommunication(@PathVariable Long communicationId,
            @RequestParam(required = false) Long companyId)
            throws HSException {
        return ResponseEntity.ok(notificationService.getByCommunicationId(communicationId, companyId));
    }
}
