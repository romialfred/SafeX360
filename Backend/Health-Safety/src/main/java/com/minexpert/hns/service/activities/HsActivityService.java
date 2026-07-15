package com.minexpert.hns.service.activities;

import java.util.List;

import com.minexpert.hns.dto.activities.HsActivityDTO;
import com.minexpert.hns.dto.activities.HsActivityDetails;
import com.minexpert.hns.dto.activities.HsActivityResponse;
import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.exception.HSException;

/**
 * Service des activites HSE (reunions HSM / tournees ST), cloisonne par mine
 * via l'activite parente (companyId), repli "null = global". companyId null en
 * parametre = pas de cloisonnement (appel systeme / allMines).
 *
 * <p>NB : {@code updateActivityStatus} reste SANS companyId : transition de
 * statut declenchee par le module Historique (hors garde utilisateur).
 */
public interface HsActivityService {

    public void createActivity(HsActivityDTO hsActivityDTO, Long companyId) throws HSException;

    public void updateActivity(HsActivityDTO hsActivityDTO, Long companyId) throws HSException;

    public void deleteActivity(Long id, Long companyId) throws HSException;

    public List<HsActivityResponse> getAllActivities(Long companyId) throws HSException;

    public HsActivityResponse getActivityInfo(Long id, Long companyId) throws HSException;

    public HsActivityDetails getActivityDetails(Long id, Long companyId) throws HSException;

    public List<HsActivityResponse> getAllMeetings(Long companyId) throws HSException;

    public List<HsActivityResponse> getAllTours(Long companyId) throws HSException;

    public void updateActivityStatus(Long activityId, ActivityStatus status) throws HSException;
}
