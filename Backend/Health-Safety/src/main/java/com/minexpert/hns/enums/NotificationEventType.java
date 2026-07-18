package com.minexpert.hns.enums;

/**
 * Types d'evenement pour lesquels un utilisateur peut couper (ou reactiver) la
 * reception des alertes DANS L'APPLICATION.
 *
 * <p>Volontairement limite aux evenements reellement diffuses par la plateforme
 * (WebSocket STOMP, cf. {@code EmergencyWebSocketProvider} cote client) :
 * SOS individuel, alerte generale, popup de tir, escalade SOS, rate de tir.
 * On n'expose PAS d'evenements qui ne sont diffuses par aucun emetteur : une
 * preference sans effet est un mensonge d'interface.</p>
 */
public enum NotificationEventType {
    SOS,
    GENERAL_ALERT,
    BLAST,
    ESCALATION,
    MISFIRE
}
