package com.minexpert.hns.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Vue légère d'un incident similaire (E3.2 — recherche de récurrence). */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SimilarIncidentDTO {
    private Long id;
    private String number;
    private String title;
    private LocalDateTime occurredAt;
    private String status;
    private boolean sameLocation;
    private boolean sameProcess;
}
