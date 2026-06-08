package com.minexpert.hns.blast.enums;

/**
 * Cycle de vie d'un tir de mine (cf. §5 du PROMPT).
 *
 * <p>Transitions autorisees (gerees par {@code BlastServiceImpl#assertTransition}) :
 * <pre>
 *   DRAFT     -&gt; PLANNED | CANCELLED
 *   PLANNED   -&gt; CONFIRMED | CANCELLED | POSTPONED | DRAFT
 *   CONFIRMED -&gt; IMMINENT | CANCELLED | POSTPONED
 *   IMMINENT  -&gt; FIRED | MISFIRE
 *   FIRED     -&gt; ALL_CLEAR | MISFIRE
 *   MISFIRE   -&gt; ALL_CLEAR (seulement apres resolution explicite)
 *   ALL_CLEAR -&gt; (terminal)
 *   CANCELLED -&gt; (terminal)
 *   POSTPONED -&gt; PLANNED (reprogrammation)
 * </pre>
 */
public enum BlastStatus {
    DRAFT,
    PLANNED,
    CONFIRMED,
    IMMINENT,
    FIRED,
    ALL_CLEAR,
    MISFIRE,
    CANCELLED,
    POSTPONED
}
