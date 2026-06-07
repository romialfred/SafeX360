package com.minexpert.hns.dosimetry.service;

import java.math.BigDecimal;
import java.util.List;

import com.minexpert.hns.dosimetry.dto.ExposureProfileLinkDTO;

public interface ExposureProfileLinkService {

    List<ExposureProfileLinkDTO> findByProfile(Long exposureProfileId);

    /**
     * Remplace l'ensemble des liens d'un profil d'exposition par la liste fournie.
     *
     * @throws IllegalArgumentException si la somme des fractions est &gt; 1.0.
     */
    void setLinks(Long exposureProfileId, List<ExposureProfileLinkDTO> links, Long userId);

    /**
     * Calcule la dose annuelle estimee en uSv : SUM(fraction * doseRate * heuresParAn).
     * doseRate provient soit du snapshot du lien si present, soit de la moyenne recente du point.
     *
     * @param workHoursPerYear nombre d'heures de travail par an (ex. 1607)
     * @return dose estimee en uSv (BigDecimal arrondi a 4 decimales)
     */
    BigDecimal computeEstimatedAnnualDose(Long exposureProfileId, int workHoursPerYear);
}
