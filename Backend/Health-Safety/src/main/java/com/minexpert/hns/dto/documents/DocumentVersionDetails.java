package com.minexpert.hns.dto.documents;

import java.time.LocalDateTime;

public interface DocumentVersionDetails {

    Long getId();

    String getDescription();

    String getMediaName();

    String getMediaType();

    Long getMediaId();

    String getVersion();

    LocalDateTime getCreatedAt();

    LocalDateTime getUpdatedAt();

}