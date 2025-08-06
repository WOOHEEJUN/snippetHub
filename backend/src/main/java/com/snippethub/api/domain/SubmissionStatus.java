package com.snippethub.api.domain;

public enum SubmissionStatus {
    PENDING("대기중", "#FF9800"),
    ACCEPTED("정답", "#4CAF50"),
    WRONG_ANSWER("오답", "#F44336"),
    TIME_LIMIT_EXCEEDED("시간초과", "#FF5722"),
    MEMORY_LIMIT_EXCEEDED("메모리초과", "#9C27B0"),
    COMPILATION_ERROR("컴파일오류", "#607D8B"),
    RUNTIME_ERROR("런타임오류", "#795548"),
    SYSTEM_ERROR("시스템오류", "#000000");

    private final String displayName;
    private final String color;

    SubmissionStatus(String displayName, String color) {
        this.displayName = displayName;
        this.color = color;
    }

    public String getDisplayName() { return displayName; }
    public String getColor() { return color; }
} 