package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "badges")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "badge_id")
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "icon", length = 50)
    private String icon; // 이모지 또는 아이콘

    @Column(name = "color", length = 20)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private BadgeCategory category;

    @Column(name = "required_count")
    private int requiredCount;

    @Column(name = "points_reward")
    private int pointsReward;

    @Column(name = "is_hidden")
    private boolean isHidden = false; // 숨겨진 뱃지 (놀라움 요소)

    @Builder
    public Badge(String name, String description, String icon, String color, 
                BadgeCategory category, int requiredCount, int pointsReward, boolean isHidden) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.color = color;
        this.category = category;
        this.requiredCount = requiredCount;
        this.pointsReward = pointsReward;
        this.isHidden = isHidden;
    }
} 