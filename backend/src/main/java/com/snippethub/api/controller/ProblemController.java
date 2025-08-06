package com.snippethub.api.controller;

import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.dto.problem.ProblemResponseDto;
import com.snippethub.api.service.ProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemController {

    private final ProblemService problemService;

    /**
     * 활성화된 문제 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemResponseDto>>> getActiveProblems(
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ProblemResponseDto> problems = problemService.getActiveProblems(pageable);
        PageResponseDto<ProblemResponseDto> response = new PageResponseDto<>(problems);
        
        return ResponseEntity.ok(ApiResponse.success("문제 목록을 조회했습니다.", response));
    }

    /**
     * 문제 상세 조회
     */
    @GetMapping("/{problemId}")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> getProblem(@PathVariable Long problemId) {
        ProblemResponseDto problem = new ProblemResponseDto(problemService.getProblem(problemId));
        return ResponseEntity.ok(ApiResponse.success("문제를 조회했습니다.", problem));
    }

    /**
     * 난이도별 문제 목록 조회
     */
    @GetMapping("/difficulty/{difficulty}")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemResponseDto>>> getProblemsByDifficulty(
            @PathVariable ProblemDifficulty difficulty,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ProblemResponseDto> problems = problemService.getProblemsByDifficulty(difficulty, pageable);
        PageResponseDto<ProblemResponseDto> response = new PageResponseDto<>(problems);
        
        return ResponseEntity.ok(ApiResponse.success(difficulty.getDisplayName() + " 난이도 문제 목록을 조회했습니다.", response));
    }

    /**
     * 카테고리별 문제 목록 조회
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemResponseDto>>> getProblemsByCategory(
            @PathVariable ProblemCategory category,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ProblemResponseDto> problems = problemService.getProblemsByCategory(category, pageable);
        PageResponseDto<ProblemResponseDto> response = new PageResponseDto<>(problems);
        
        return ResponseEntity.ok(ApiResponse.success(category.getDisplayName() + " 카테고리 문제 목록을 조회했습니다.", response));
    }

    /**
     * 난이도 + 카테고리별 문제 목록 조회
     */
    @GetMapping("/difficulty/{difficulty}/category/{category}")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemResponseDto>>> getProblemsByDifficultyAndCategory(
            @PathVariable ProblemDifficulty difficulty,
            @PathVariable ProblemCategory category,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ProblemResponseDto> problems = problemService.getProblemsByDifficultyAndCategory(difficulty, category, pageable);
        PageResponseDto<ProblemResponseDto> response = new PageResponseDto<>(problems);
        
        return ResponseEntity.ok(ApiResponse.success(
                difficulty.getDisplayName() + " " + category.getDisplayName() + " 문제 목록을 조회했습니다.", response));
    }

    /**
     * 제목으로 문제 검색
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponseDto<ProblemResponseDto>>> searchProblemsByTitle(
            @RequestParam String title,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<ProblemResponseDto> problems = problemService.searchProblemsByTitle(title, pageable);
        PageResponseDto<ProblemResponseDto> response = new PageResponseDto<>(problems);
        
        return ResponseEntity.ok(ApiResponse.success("'" + title + "' 검색 결과를 조회했습니다.", response));
    }

    /**
     * 랜덤 문제 조회
     */
    @GetMapping("/random")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> getRandomProblem() {
        Optional<ProblemResponseDto> problem = problemService.getRandomProblem()
                .map(ProblemResponseDto::new);
        
        if (problem.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success("랜덤 문제를 조회했습니다.", problem.get()));
        } else {
            return ResponseEntity.ok(ApiResponse.error("사용 가능한 문제가 없습니다."));
        }
    }

    /**
     * 난이도별 랜덤 문제 조회
     */
    @GetMapping("/random/difficulty/{difficulty}")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> getRandomProblemByDifficulty(
            @PathVariable ProblemDifficulty difficulty) {
        
        Optional<ProblemResponseDto> problem = problemService.getRandomProblemByDifficulty(difficulty)
                .map(ProblemResponseDto::new);
        
        if (problem.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(difficulty.getDisplayName() + " 난이도 랜덤 문제를 조회했습니다.", problem.get()));
        } else {
            return ResponseEntity.ok(ApiResponse.error(difficulty.getDisplayName() + " 난이도의 사용 가능한 문제가 없습니다."));
        }
    }

    /**
     * 문제 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<ProblemService.ProblemStatistics>> getProblemStatistics() {
        ProblemService.ProblemStatistics statistics = problemService.getProblemStatistics();
        return ResponseEntity.ok(ApiResponse.success("문제 통계를 조회했습니다.", statistics));
    }

    /**
     * 난이도 목록 조회
     */
    @GetMapping("/difficulties")
    public ResponseEntity<ApiResponse<ProblemDifficulty[]>> getDifficulties() {
        return ResponseEntity.ok(ApiResponse.success("난이도 목록을 조회했습니다.", ProblemDifficulty.values()));
    }

    /**
     * 카테고리 목록 조회
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<ProblemCategory[]>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success("카테고리 목록을 조회했습니다.", ProblemCategory.values()));
    }
} 