package com.minexpert.hns.dto.planning;

import com.minexpert.hns.enums.ThemeCategory;
import com.minexpert.hns.entity.planning.Theme;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ThemeDTO {
    private Long id;
    private LocalDate month;
    private ThemeCategory category;
    private String type;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Theme toEntity() {
        Theme theme = new Theme();
        theme.setId(this.id);
        theme.setMonth(this.month);
        theme.setCategory(this.category);
        theme.setType(this.type);
        theme.setTitle(this.title);
        theme.setDescription(this.description);
        theme.setCreatedAt(this.createdAt);
        theme.setUpdatedAt(this.updatedAt);
        return theme;
    }
}
