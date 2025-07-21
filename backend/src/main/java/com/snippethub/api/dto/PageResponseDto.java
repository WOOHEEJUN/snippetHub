package com.snippethub.api.dto;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
public class PageResponseDto<T> {

    private final List<T> content;
    private final int currentPage;
    private final int totalPages;
    private final long totalElements;
    private final boolean hasNext;
    private final boolean hasPrevious;

    public PageResponseDto(Page<T> page) {
        this.content = page.getContent();
        this.currentPage = page.getNumber();
        this.totalPages = page.getTotalPages();
        this.totalElements = page.getTotalElements();
        this.hasNext = page.hasNext();
        this.hasPrevious = page.hasPrevious();
    }
}
