package com.minexpert.hns.repository.audit;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.audit.FollowupResponse;
import com.minexpert.hns.entity.audit.RecommendationFollowup;

public interface RecommendationFollowupRepository extends CrudRepository<RecommendationFollowup, Long> {
    Optional<RecommendationFollowup> findByRecommendation_Id(Long recommendationId);

    @Query("Select f.id AS id, f.createdAt AS followupDate, f.comment AS comment, f.progress AS progress, "
            + "f.status AS status, f.recommendation.id AS recommendationId "
            + "FROM RecommendationFollowup f WHERE f.recommendation.id = ?1")
    List<FollowupResponse> findAllRecommendationFollowupsByRecommendationId(Long recommendationId);

}
