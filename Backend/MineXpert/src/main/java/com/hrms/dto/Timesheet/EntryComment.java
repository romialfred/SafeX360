package com.hrms.dto.Timesheet;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntryComment {
    private String attendance;
    private Comment comment;
}