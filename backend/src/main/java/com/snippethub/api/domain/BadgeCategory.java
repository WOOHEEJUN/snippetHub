package com.snippethub.api.domain;

public enum BadgeCategory {
    CREATION("창작", "사용자가 콘텐츠를 생성할 때 획득"),
    ENGAGEMENT("참여", "다른 사용자와 상호작용할 때 획득"),
    ACHIEVEMENT("성취", "특정 목표를 달성했을 때 획득"),
    SPECIAL("특별", "특별한 이벤트나 조건에서 획득"),
    MILESTONE("이정표", "중요한 단계를 달성했을 때 획득"),
    COMMUNITY("커뮤니티", "커뮤니티에 기여할 때 획득");

    private final String displayName;
    private final String description;

    BadgeCategory(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
} 