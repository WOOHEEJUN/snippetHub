package com.snippethub.api.domain;

public enum UserLevel {
    BRONZE("브론즈", 0, "🥉", "#CD7F32"),
    SILVER("실버", 100, "🥈", "#C0C0C0"),
    GOLD("골드", 500, "🥇", "#FFD700"),
    PLATINUM("플래티넘", 1000, "💎", "#E5E4E2"),
    DIAMOND("다이아몬드", 2500, "💎", "#B9F2FF"),
    MASTER("마스터", 5000, "👑", "#FF6B6B"),
    GRANDMASTER("그랜드마스터", 10000, "🏆", "#FFD93D"),
    LEGEND("레전드", 20000, "⭐", "#FF6B9D");

    private final String displayName;
    private final int requiredPoints;
    private final String emoji;
    private final String color;

    UserLevel(String displayName, int requiredPoints, String emoji, String color) {
        this.displayName = displayName;
        this.requiredPoints = requiredPoints;
        this.emoji = emoji;
        this.color = color;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getRequiredPoints() {
        return requiredPoints;
    }

    public String getEmoji() {
        return emoji;
    }

    public String getColor() {
        return color;
    }

    public static UserLevel getLevelByPoints(int points) {
        UserLevel[] levels = UserLevel.values();
        UserLevel currentLevel = BRONZE;
        
        for (UserLevel level : levels) {
            if (points >= level.requiredPoints) {
                currentLevel = level;
            } else {
                break;
            }
        }
        
        return currentLevel;
    }

    public UserLevel getNextLevel() {
        UserLevel[] levels = UserLevel.values();
        for (int i = 0; i < levels.length - 1; i++) {
            if (levels[i] == this) {
                return levels[i + 1];
            }
        }
        return this; // 이미 최고 등급
    }

    public int getPointsToNextLevel(int currentPoints) {
        UserLevel nextLevel = getNextLevel();
        if (nextLevel == this) {
            return 0; // 이미 최고 등급
        }
        return nextLevel.requiredPoints - currentPoints;
    }
} 