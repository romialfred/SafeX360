package com.minexpert.hns.dosimetry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resultat d'une creation ou d'un supersede de DoseRecord.
 *
 * <p>Expose en retour :
 * <ul>
 *   <li>recordId : id du DoseRecord (le NOUVEAU en cas de supersede)</li>
 *   <li>version : numero de version (1 pour create, n+1 pour supersede)</li>
 *   <li>requiresDoubleValidation : flag declenche lorsqu'une des valeurs depasse un seuil
 *       de safety nominatif (hp10 &gt; 10 mSv OU hp007 &gt; 100 mSv OU hp3 &gt; 10 mSv) - signale au
 *       frontend qu'une double validation RPO est requise avant publication.</li>
 *   <li>alertsCreated : nombre d'alertes ExposureAlert nouvellement creees par le
 *       ThresholdEngine sur ce record (indicateur immediat pour le frontend).</li>
 * </ul>
 *
 * <p>Backward-compat : DoseRecordService expose toujours create(...) renvoyant Long
 * (id seul), pour conserver les contrats existants. Cette DTO est servie par les nouvelles
 * methodes createWithResult / supersedeWithResult cablees sur le controller.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoseRecordCreateResultDTO {

    private Long recordId;
    private int version;
    private boolean requiresDoubleValidation;
    private int alertsCreated;
}
