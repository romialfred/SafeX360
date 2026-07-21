package com.minexpert.hns.api.emergency.enums;

/**
 * Émetteur d'un message du fil de communication d'un SOS.
 *
 * <ul>
 *   <li>{@code COORDINATOR} — le centre de contrôle / intervenant.</li>
 *   <li>{@code VICTIM} — la personne en détresse (réponses depuis son appareil).</li>
 *   <li>{@code SYSTEM} — entrées automatiques (jalons d'étape, escalades).</li>
 * </ul>
 */
public enum SosMessageSender {
    COORDINATOR,
    VICTIM,
    SYSTEM
}
