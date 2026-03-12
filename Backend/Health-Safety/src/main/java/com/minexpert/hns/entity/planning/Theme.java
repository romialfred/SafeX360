package com.minexpert.hns.entity.planning;

import com.minexpert.hns.enums.ThemeCategory;
import com.minexpert.hns.dto.planning.ThemeDTO;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "theme")
public class Theme {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate month;
    @Enumerated(EnumType.STRING)
    private ThemeCategory category;
    private String type;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ThemeDTO toDTO() {
        return new ThemeDTO(
                this.id,
                this.month,
                this.category,
                this.type,
                this.title,
                this.description,
                this.createdAt,
                this.updatedAt);
    }
}
