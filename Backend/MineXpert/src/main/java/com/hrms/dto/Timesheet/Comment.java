package com.hrms.dto.Timesheet;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.json.JSONArray;
import org.json.JSONObject;

import com.hrms.enums.CommentType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Comment {
    private String name;
    private String comment;
    private CommentType type;
    private LocalDateTime timestamp;

    public JSONObject toJsonObject() {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("name", this.name);
        jsonObject.put("comment", this.comment);
        jsonObject.put("type", this.type != null ? this.type.name() : null);
        jsonObject.put("timestamp", this.timestamp);
        return jsonObject;
    }

    public static Comment fromJsonObject(JSONObject jsonObject) {
        return new Comment(
                jsonObject.getString("name"),
                jsonObject.getString("comment"),
                CommentType.valueOf(jsonObject.getString("type")),
                LocalDateTime.parse(jsonObject.getString("timestamp"), DateTimeFormatter.ISO_DATE_TIME));
    }

    public static List<Comment> jsonArrayToList(String jsonArrayString) {
        JSONArray jsonArray = new JSONArray(jsonArrayString);
        return IntStream.range(0, jsonArray.length())
                .mapToObj(jsonArray::getJSONObject)
                .map(Comment::fromJsonObject)
                .collect(Collectors.toList());
    }
}
