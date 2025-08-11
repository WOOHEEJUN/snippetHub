package com.snippethub.api.domain;

public enum NotificationType {
    COMMENT("댓글"),
    LIKE("좋아요"),
    POINT_EARNED("포인트 획득"),
    LEVEL_UP("레벨업"),
    BADGE_EARNED("뱃지 획득"),
    NEW_PROBLEM("새로운 문제"),
    DAILY_LOGIN("일일 로그인"),
    CONSECUTIVE_LOGIN("연속 로그인"),
    AI_EVALUATION("AI 평가"),
    PROBLEM_SOLVE("문제 해결");

    private final String displayName;

    NotificationType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
