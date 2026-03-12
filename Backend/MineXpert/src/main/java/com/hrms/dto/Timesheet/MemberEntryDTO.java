package com.hrms.dto.Timesheet;

import java.time.LocalDate;
import java.util.List;

import org.json.JSONArray;

import com.hrms.dto.EmployeeDTO;
import com.hrms.entity.Timesheet.MemberEntry;
import com.hrms.enums.EntryStatus;
import com.hrms.enums.EntryType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MemberEntryDTO {
    private Long id;
    private TimesheetDTO timesheet;
    private TeamMemberDTO teamMember;
    private EmployeeDTO employee;
    private LocalDate date;
    private String attendance;

    private List<Comment> comments;
    private EntryStatus status;
    private EntryType type;

    public MemberEntry toEntity() {
        return new MemberEntry(this.id, this.timesheet != null ? this.timesheet.toEntity() : null,
                this.teamMember != null ? this.teamMember.toEntity() : null,
                this.employee != null ? this.employee.toEntity() : null, this.date, this.attendance,
                this.comments != null
                        ? new JSONArray(this.comments.stream().map(Comment::toJsonObject).toList()).toString(0)
                        : null,
                this.status, this.type);
    }

}
