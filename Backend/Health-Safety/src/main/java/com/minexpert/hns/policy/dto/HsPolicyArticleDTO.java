package com.minexpert.hns.policy.dto;

import com.minexpert.hns.policy.entity.HsPolicyArticle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsPolicyArticleDTO {
    private Long id;
    private Integer orderIndex;
    private String title;
    private String body;
    private String explanation;

    public static HsPolicyArticleDTO fromEntity(HsPolicyArticle a) {
        return new HsPolicyArticleDTO(a.getId(), a.getOrderIndex(), a.getTitle(), a.getBody(), a.getExplanation());
    }
}
