package com.minexpert.hns.blast.enums;

/**
 * Types de tirs pratiques en mine (cf. §11 du PROMPT).
 *
 * <ul>
 *   <li>{@link #PRODUCTION} : tir de production (extraction du minerai).</li>
 *   <li>{@link #DEVELOPMENT} : tir de developpement (creation de gradins, acces).</li>
 *   <li>{@link #SECONDARY} : petardage / fragmentation secondaire de blocs.</li>
 *   <li>{@link #PRESPLIT} : tir de presplit (decoupage du massif).</li>
 *   <li>{@link #FINAL} : tir de finition (parement final).</li>
 * </ul>
 */
public enum BlastType {
    PRODUCTION,
    DEVELOPMENT,
    SECONDARY,
    PRESPLIT,
    FINAL
}
