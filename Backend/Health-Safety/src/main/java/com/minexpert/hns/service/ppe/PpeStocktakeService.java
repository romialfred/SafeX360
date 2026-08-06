package com.minexpert.hns.service.ppe;

import com.minexpert.hns.dto.ppe.PpeStocktakeDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface PpeStocktakeService {

    /** Crée une session d'inventaire (DRAFT) : fige le stock système par ligne, calcule les écarts. */
    PpeStocktakeDTO create(PpeStocktakeDTO dto, Long companyId, Long actorId) throws HSException;

    /** Clôture l'inventaire : passe les écarts en ajustements de stock (via le journal), DRAFT→VALIDATED. */
    PpeStocktakeDTO validate(Long id, Long companyId, Long actorId) throws HSException;

    /** Abandonne un brouillon (DRAFT→CANCELLED, aucun effet sur le stock). */
    PpeStocktakeDTO cancel(Long id, Long companyId) throws HSException;

    PpeStocktakeDTO getById(Long id, Long companyId) throws HSException;

    List<PpeStocktakeDTO> getAll(Long companyId) throws HSException;
}
