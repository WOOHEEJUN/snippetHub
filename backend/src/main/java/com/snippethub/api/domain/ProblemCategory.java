package com.snippethub.api.domain;

public enum ProblemCategory {
    ALGORITHM("알고리즘", "알고리즘 문제 해결"),
    DATA_STRUCTURE("자료구조", "자료구조 활용 문제"),
    STRING("문자열", "문자열 처리 문제"),
    MATH("수학", "수학적 문제 해결"),
    GRAPH("그래프", "그래프 알고리즘 문제"),
    DYNAMIC_PROGRAMMING("동적 프로그래밍", "DP 문제 해결"),
    GREEDY("그리디", "그리디 알고리즘 문제"),
    BRUTE_FORCE("완전 탐색", "브루트 포스 문제"),
    WEB_DEVELOPMENT("웹개발", "웹 개발 관련 문제"),
    DATABASE("데이터베이스", "SQL 및 데이터베이스 문제"),
    SYSTEM_DESIGN("시스템설계", "시스템 설계 문제"),
    FRONTEND("프론트엔드", "HTML, CSS, JavaScript 문제"),
    BACKEND("백엔드", "서버 개발 문제"),
    DEVOPS("데브옵스", "인프라 및 배포 문제");

    private final String displayName;
    private final String description;

    ProblemCategory(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
} 