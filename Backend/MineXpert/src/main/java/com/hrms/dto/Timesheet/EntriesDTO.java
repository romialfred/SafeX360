package com.hrms.dto.Timesheet;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntriesDTO {
    private List<Long> memberIds;
    private String attendance;
    private Comment comment;
}
