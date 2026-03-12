package com.hrms.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.cglib.core.Local;

import com.hrms.entity.Company;
import com.hrms.entity.Holiday;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HolidayDTO {
    private Long id;
    private String name;
    private Company company;
    private LocalDate startDate;
    private LocalDate endDate;

    public Holiday toEntity() {
        return new Holiday(this.id, this.name, this.company, this.startDate, this.endDate);
    }
}
