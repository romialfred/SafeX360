package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.notification.NotificationPreferenceDTO;
import com.minexpert.hns.dto.notification.NotificationPreferenceUpdateDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.notification.NotificationPreferenceService;

import lombok.RequiredArgsConstructor;

/**
 * API des preferences de notification in-app (gateway
 * {@code /hns/notification-preference}). companyId arrive en query (clampe /
 * valide par CompanyScopeFilter).
 *
 * <p>Seul le canal in-app (WEB) est expose : aucun emetteur email/SMS/push
 * n'existe sur la plateforme, le canal n'est donc pas un parametre.</p>
 */
@RestController
@RequestMapping("/notification-preference")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class NotificationPreferenceAPI {

    private final NotificationPreferenceService preferenceService;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationPreferenceDTO>> myPreferences(
            @RequestParam(required = false) Long companyId,
            @RequestParam Long userId) throws HSException {
        return new ResponseEntity<>(preferenceService.getMyPreferences(companyId, userId), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> update(
            @RequestParam(required = false) Long companyId,
            @RequestParam Long userId,
            @RequestBody NotificationPreferenceUpdateDTO dto) throws HSException {
        preferenceService.updatePreference(companyId, userId, dto.getEventType(),
                Boolean.TRUE.equals(dto.getEnabled()));
        return new ResponseEntity<>(new ResponseDTO("Notification preference updated."), HttpStatus.OK);
    }
}
