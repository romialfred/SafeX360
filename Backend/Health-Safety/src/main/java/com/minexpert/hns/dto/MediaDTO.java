package com.minexpert.hns.dto;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Base64;

import com.minexpert.hns.entity.Media;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MediaDTO {
    private Long id;
    private String name;
    private String type;
    private String file;

    public Media toEntity() {
        return new Media(id, name, type, file != null ? Base64.getDecoder().decode(file) : null);
    }

    public File toFile() throws IOException {
        if (file == null || file.isBlank()) {
            return null;
        }

        byte[] decoded = Base64.getDecoder().decode(file);

        String prefix = (name != null && !name.isBlank())
                ? name.replaceAll("[^a-zA-Z0-9_-]", "_")
                : "media";
        if (prefix.length() < 3) {
            prefix = (prefix + "___").substring(0, 3);
        }

        String suffix = null;
        if (name != null && name.contains(".")) {
            suffix = name.substring(name.lastIndexOf('.'));
        } else if (type != null && type.contains("/")) {
            suffix = "." + type.substring(type.indexOf('/') + 1);
        }

        File tempFile = File.createTempFile(prefix, suffix);
        tempFile.deleteOnExit();
        Files.write(tempFile.toPath(), decoded);
        return tempFile;
    }

}
