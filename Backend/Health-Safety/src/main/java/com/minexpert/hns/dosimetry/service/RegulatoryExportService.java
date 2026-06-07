package com.minexpert.hns.dosimetry.service;

import com.minexpert.hns.dosimetry.dto.DosimetryReportDocumentDTO;

/**
 * Exports reglementaires (XML / CSV) destines a l'ASN (Autorite de Surete Nucleaire) et plus
 * largement aux autorites de tutelle (AIEA, inspection du travail). Phase 9.
 *
 * <p>Conventions :
 * <ul>
 *   <li>Tous les exports sont AUDITES avec action {@code EXPORT_XML_ASN},
 *       {@code EXPORT_CSV_REGULATOR}, ou {@code EXPORT_INCIDENTS_XML}.</li>
 *   <li>Le CSV embarque un BOM UTF-8 pour ouverture directe dans Excel sans corruption des
 *       accents.</li>
 *   <li>Le XML produit un schema simplifie (un element par worker + dose annuelle, categorie,
 *       aptitude) - conforme a la trame ASN/AIEA partage en spec.</li>
 * </ul>
 */
public interface RegulatoryExportService {

    /**
     * Export XML annuel "fiche ASN" d'une mine : un element WORKER par travailleur expose
     * avec doses annuelles agglomerees (Hp10/Hp007/Hp3), categorie A/B et aptitude courante
     * (label, sans donnees cliniques).
     *
     * @return DTO portant content-type {@code application/xml} et filename
     *         {@code asn_annual_{mineId}_{year}.xml}
     */
    DosimetryReportDocumentDTO exportAnnualXmlForAsn(Long mineId, int year, Long requesterId);

    /**
     * Export CSV avec colonnes normalisees pour l'inspecteur :
     * {@code workerId,fullName,category,hp10AnnualMsv,hp007AnnualMsv,hp3AnnualMsv,fitness,...}.
     *
     * <p>Le parametre {@code format} est gardenotamment pour des variantes futures (ex.
     * "ASN_V1", "AIEA_GSR_PART3") - non utilise dans la trame de base.
     */
    DosimetryReportDocumentDTO exportAnnualCsvForRegulator(Long mineId, int year, Long requesterId,
            String format);

    /**
     * Export XML des cas de surexposition declares pour une mine et une annee donnees.
     */
    DosimetryReportDocumentDTO exportIncidentsXmlForAsn(Long mineId, int year, Long requesterId);
}
