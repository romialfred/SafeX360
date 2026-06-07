package com.minexpert.hns.dosimetry.enums;

/**
 * Etats du workflow d'une campagne de surveillance d'ambiance.
 *
 * <p>Transitions autorisees :
 * <pre>
 *   DRAFT --&gt; ONGOING (start)
 *   ONGOING --&gt; COMPLETED (complete)
 *   DRAFT --&gt; CANCELLED (cancel)
 *   ONGOING --&gt; CANCELLED (cancel)
 * </pre>
 */
public enum CampaignStatus {
    DRAFT,
    ONGOING,
    COMPLETED,
    CANCELLED
}
