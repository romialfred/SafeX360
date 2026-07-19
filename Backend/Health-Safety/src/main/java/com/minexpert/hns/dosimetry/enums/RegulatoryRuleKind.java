package com.minexpert.hns.dosimetry.enums;

/** Nature de la valeur, afin de ne pas confondre limite, contrainte et seuil. */
public enum RegulatoryRuleKind {
    REGULATORY_LIMIT,
    DOSE_CONSTRAINT,
    INVESTIGATION_LEVEL,
    ACTION_LEVEL,
    CLASSIFICATION_THRESHOLD
}
