package com.minexpert.hns.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.minexpert.hns.entity.Media;

public interface MediaRepository extends CrudRepository<Media, Long> {

    List<Media> findAllByIdIn(List<Long> mediaIdArray);

}
