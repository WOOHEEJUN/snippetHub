package com.snippethub.api.domain;

public enum ProblemDifficulty {
    EASY("쉬움", 1, "#4CAF50", 10),
    MEDIUM("보통", 2, "#FF9800", 20),
    HARD("어려움", 3, "#F44336", 30),
    EXPERT("전문가", 4, "#9C27B0", 50);

    private final String displayName;
    private final int level;
    private final String color;
    private final int pointsReward;

    ProblemDifficulty(String displayName, int level, String color, int pointsReward) {
        this.displayName = displayName;
        this.level = level;
        this.color = color;
        this.pointsReward = pointsReward;
    }

    public String getDisplayName() { return displayName; }
    public int getLevel() { return level; }
    public String getColor() { return color; }
    public int getPointsReward() { return pointsReward; }
} 