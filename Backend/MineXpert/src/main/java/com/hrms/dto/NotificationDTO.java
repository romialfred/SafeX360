package com.hrms.dto;
import java.time.LocalDateTime;

import com.hrms.entity.Notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private Long id;
    private Long accountId;
    private String title;
    private String message;
    private String route;
    private String type; 
    private LocalDateTime timestamp;

    public Notification toEntity() {
		return new Notification(this.id, this.accountId,  this.title, this.message, this.route, this.type, this.timestamp);
	}

}
