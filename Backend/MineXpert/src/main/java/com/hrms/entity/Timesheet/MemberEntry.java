package com.hrms.entity.Timesheet;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.hrms.dto.Timesheet.Comment;
import com.hrms.dto.Timesheet.MemberEntryDTO;
import com.hrms.entity.Employee;
import com.hrms.enums.EntryStatus;
import com.hrms.enums.EntryType;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MemberEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timesheet_id", nullable = false)
    @JsonBackReference
    private Timesheet timesheet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_member_id", nullable = false)
    @JsonBackReference
    private TeamMember teamMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonBackReference
    private Employee employee;

    private LocalDate date;

    private String attendance;
    @Lob
    private String comments;

    @Enumerated(EnumType.STRING)
    private EntryStatus status;
    @Enumerated(EnumType.STRING)
    private EntryType type;

    public MemberEntry(Long id) {
        this.id = id;
    }

    public MemberEntryDTO toDTO() {
        return new MemberEntryDTO(this.id, null,
                this.teamMember != null ? this.teamMember.toDTO() : null,
                this.employee != null ? this.employee.toDTO() : null, this.date,
                this.attendance, this.comments != null ? Comment.jsonArrayToList(this.comments) : null, this.status,
                this.type);
    }
}
