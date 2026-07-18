package com.minexpert.hns.dto.notification;

import com.minexpert.hns.enums.NotificationEventType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Corps de la requete de bascule d'une preference : un type d'evenement et
 * l'etat souhaite. Le canal n'est PAS demande — seul le canal in-app (WEB)
 * existe reellement, il est impose serveur.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationPreferenceUpdateDTO {
    private NotificationEventType eventType;
    private Boolean enabled;
}
