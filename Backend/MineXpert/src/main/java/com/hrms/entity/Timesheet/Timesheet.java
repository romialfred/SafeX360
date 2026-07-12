package com.hrms.entity.Timesheet;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hrms.dto.Timesheet.TimesheetDTO;
import com.hrms.enums.TimesheetStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Timesheet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @JsonBackReference
    private Team team;

    @OneToMany(mappedBy = "timesheet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<MemberEntry> memberEntries;
    private LocalDate startDate;
    private LocalDate endDate;
    @Enumerated(EnumType.STRING)
    private TimesheetStatus status;
    @OneToMany(mappedBy = "timesheet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Signature> signatures;

    public Timesheet(Long id) {
        this.id = id;
    }

    public TimesheetDTO toDTO() {
        return new TimesheetDTO(this.id, this.team != null ? this.team.toDTO() : null,
                this.memberEntries != null ? this.memberEntries.stream().map(MemberEntry::toDTO).toList() : null,
                this.startDate,
                this.endDate, this.status,
                this.signatures != null ? this.signatures.stream().map(Signature::toDTO).toList() : null);

    }
}
