package com.minexpert.hns.dosimetry.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.minexpert.hns.dosimetry.enums.DosimeterStatus;
import com.minexpert.hns.dosimetry.enums.DosimeterType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Filtres de recherche pour le parc de dosimetres.
 *
 * <p>Tous les champs sont optionnels (null = pas de restriction sur ce critere) sauf mineId qui
 * porte l'isolation multi-tenant (un filtre sans mineId retourne une liste vide).
 *
 * <p>{@code calibrationDueWithinDays} : seuil d'alerte etalonnage. Si != null, ne renvoie que
 * les dosimetres dont {@code calibrationDueDate} est inferieure a {@code today + N jours}
 * (ex. valeur 30 = etalonnage echeance &lt; 30 jours).
 *
 * <p>{@code search} : recherche textuelle insensible sur le numero de serie ou le QR code.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchDosimeterFiltersDTO {

    private Long mineId;

    /**
     * Statuts multi-select (intersection). Null/empty = pas de filtre statut.
     *
     * <p>L'alias Jackson {@code statuses} (pluriel) accepte la convention du frontend qui envoie
     * un nom au pluriel pour les listes. Le serveur accepte indifferemment {@code status} ou
     * {@code statuses} dans le payload JSON.
     */
    @JsonAlias("statuses")
    private List<DosimeterStatus> status;

    /** Type technologique du dosimetre (TLD/OSL/EPD/FILM). */
    private DosimeterType type;

    /** Filtre alerte etalonnage : ne renvoie que les dosimetres dus dans &lt; N jours. */
    private Integer calibrationDueWithinDays;

    /** Recherche libre sur serial ou qrCode (insensible a la casse). */
    private String search;
}
