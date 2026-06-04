package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ThemeDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ThemeService {
    ThemeDTO createTheme(ThemeDTO dto) throws HSException;

    ThemeDTO updateTheme(ThemeDTO dto) throws HSException;

    void deleteTheme(Long id) throws HSException;

    List<ThemeDTO> getAllThemes() throws HSException;

    List<ThemeDTO> getAllThemesByYear(int year) throws HSException;

    ThemeDTO getThemeById(Long id) throws HSException;
}
