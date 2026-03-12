package com.hrms.DataInterface;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberEntries {
    private Long empId;
    private String name;
    private String empNumber;
    private String teamName;
    private Long teamId;
    private List<String> attendances;
}
