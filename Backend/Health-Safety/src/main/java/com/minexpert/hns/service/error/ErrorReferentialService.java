package com.minexpert.hns.service.error;

import java.util.List;

import com.minexpert.hns.entity.error.ErrorCriticalityMatrix;
import com.minexpert.hns.entity.error.ErrorEventType;
import com.minexpert.hns.entity.error.ErrorProbability;
import com.minexpert.hns.entity.error.ErrorSeverity;

/**
 * Acces en lecture aux referentiels parametrables du module Gestion des Erreurs
 * (types d'evenement, gravites, probabilites, matrice de criticite).
 */
public interface ErrorReferentialService {

    List<ErrorEventType> listEventTypes(Long companyId);

    List<ErrorSeverity> listSeverities();

    List<ErrorProbability> listProbabilities();

    List<ErrorCriticalityMatrix> listCriticalityMatrix();
}
