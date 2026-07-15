package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ActivityDTO;
import com.minexpert.hns.entity.planning.ActivityStatus;
import com.minexpert.hns.enums.ActivityCategory;
import com.minexpert.hns.exception.HSException;

import java.util.List;

/**
 * Service de planification des activites HSE, cloisonne par mine (companyId)
 * avec repli "null = global" : les activites seedees globalement (companyId
 * null) restent visibles de toutes les mines. companyId null en parametre =
 * pas de cloisonnement (appel systeme / allMines).
 *
 * <p>NB : {@code changeActivityStatus*} restent SANS companyId : ce sont des
 * transitions declenchees par des entites liees (HsActivity, GeneralInspection
 * — hors module planning) et ne doivent pas casser ces appelants.
 */
public interface ActivityService {
    ActivityDTO createActivity(ActivityDTO dto) throws HSException;

    ActivityDTO updateActivity(ActivityDTO dto, Long companyId) throws HSException;

    void deleteActivity(Long id, Long companyId) throws HSException;

    List<ActivityDTO> getAllActivities(Long companyId) throws HSException;

    List<ActivityDTO> getAllActivitiesByYear(int year, Long companyId) throws HSException;

    ActivityDTO getActivityById(Long id, Long companyId) throws HSException;

    List<ActivityDTO> getActivitiesByYearStatusCategory(int year, ActivityStatus status,
            ActivityCategory category, Long companyId) throws HSException;

    void changeActivityStatusProgress(Long id) throws HSException;

    void changeActivityStatusCompleted(Long id) throws HSException;

    void changeActivityStatusRejected(Long id) throws HSException;
}
