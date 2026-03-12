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
    public ResponseEntity<NotificationDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(notificationService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<NotificationSummaryView>> getAll() throws HSException {
        return ResponseEntity.ok(notificationService.getAll());
    }

    @GetMapping
    public ResponseEntity<List<NotificationSummaryView>> list() throws HSException {
        return ResponseEntity.ok(notificationService.getAll());
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<NotificationDTO>> getActive() throws HSException {
        return ResponseEntity.ok(notificationService.getActive());
    }

    @GetMapping("/getExpired")
    public ResponseEntity<List<NotificationDTO>> getExpired() throws HSException {
        return ResponseEntity.ok(notificationService.getExpired());
    }

    @GetMapping("/communication/{communicationId}")
    public ResponseEntity<List<NotificationDTO>> getByCommunication(@PathVariable Long communicationId)
            throws HSException {
        return ResponseEntity.ok(notificationService.getByCommunicationId(communicationId));
    }
}
