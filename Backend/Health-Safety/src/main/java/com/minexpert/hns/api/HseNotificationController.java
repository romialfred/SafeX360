package com.minexpert.hns.api;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.notification.HseNotificationDTO;
import com.minexpert.hns.service.notification.HseNotificationService;

import lombok.RequiredArgsConstructor;

/**
 * Fil de notifications SLA HSE (ISO 45001 §9.1), cloisonné par mine. Le
 * paramètre {@code companyId} est clampé par le CompanyScopeFilter (fail-closed) ;
 * en vue consolidée « Toutes les Mines » il peut être nul → fil vide (l'équipe
 * consulte le fil d'une mine précise).
 */
@RestController
@RequestMapping("/hse-notification")
@CrossOrigin
@RequiredArgsConstructor
public class HseNotificationController {

    private final HseNotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<HseNotificationDTO>> list(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(value = "limit", defaultValue = "30") int limit) {
        if (companyId == null) {
            return new ResponseEntity<>(List.of(), HttpStatus.OK);
        }
        return new ResponseEntity<>(notificationService.list(companyId, unreadOnly, limit), HttpStatus.OK);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestParam(value = "companyId", required = false) Long companyId) {
        long count = companyId == null ? 0L : notificationService.unreadCount(companyId);
        return new ResponseEntity<>(Map.of("count", count), HttpStatus.OK);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Boolean>> markRead(
            @RequestParam(value = "companyId", required = false) Long companyId,
            @PathVariable Long id) {
        boolean updated = companyId != null && notificationService.markRead(companyId, id);
        return new ResponseEntity<>(Map.of("updated", updated), HttpStatus.OK);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @RequestParam(value = "companyId", required = false) Long companyId) {
        int updated = companyId == null ? 0 : notificationService.markAllRead(companyId);
        return new ResponseEntity<>(Map.of("updated", updated), HttpStatus.OK);
    }
}
