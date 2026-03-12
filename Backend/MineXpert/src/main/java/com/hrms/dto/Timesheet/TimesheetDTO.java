package com.hrms.dto.Timesheet;

import java.time.LocalDate;
import java.util.List;

import com.hrms.entity.Timesheet.Timesheet;
import com.hrms.enums.TimesheetStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimesheetDTO {
    private Long id;
    private TeamDTO team;
    private List<MemberEntryDTO> memberEntries;
    private LocalDate startDate;
    private LocalDate endDate;
    private TimesheetStatus status;
    private List<SignatureDTO> signatures;

    public Timesheet toEntity() {
        return new Timesheet(this.id, this.team != null ? this.team.toEntity() : null,
                this.memberEntries != null ? this.memberEntries.stream().map(MemberEntryDTO::toEntity).toList() : null,
                this.startDate,
                this.endDate, this.status,
                this.signatures != null ? this.signatures.stream().map(SignatureDTO::toEntity).toList() : null);
    }
}
