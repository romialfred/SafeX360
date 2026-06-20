package com.minexpert.hns.repository.error;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.error.ErrorAttachment;

public interface ErrorAttachmentRepository extends CrudRepository<ErrorAttachment, Long> {

    List<ErrorAttachment> findByErrorEventId(Long errorEventId);
}
