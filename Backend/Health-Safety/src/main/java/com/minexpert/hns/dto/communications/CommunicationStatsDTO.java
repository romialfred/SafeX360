package com.minexpert.hns.dto.communications;

import java.util.List;

public record CommunicationStatsDTO(
        List<TypeCount> byType,
        List<CategoryCount> byCategory,
        List<DepartmentCount> byDepartment
) {
    public record TypeCount(String type, Long total) {}

    public record CategoryCount(String category, Long total) {}

    public record DepartmentCount(Long departmentId, Long total) {}
}
