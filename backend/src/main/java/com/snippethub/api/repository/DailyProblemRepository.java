package com.snippethub.api.repository;

import com.snippethub.api.domain.DailyProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyProblemRepository extends JpaRepository<DailyProblem, Long> {

    // 특정 날짜의 일일 과제 조회
    Optional<DailyProblem> findByProblemDate(LocalDate problemDate);
    
    // 특정 날짜의 모든 일일 과제 조회 (생성일 기준 내림차순)
    List<DailyProblem> findByProblemDateOrderByCreatedAtDesc(LocalDate problemDate);
    
    // 활성화된 일일 과제 조회
    Optional<DailyProblem> findByProblemDateAndIsActiveTrue(LocalDate problemDate);
    
    // 최근 일일 과제들 조회
    List<DailyProblem> findByProblemDateBetweenOrderByProblemDateDesc(
        LocalDate startDate, LocalDate endDate);
    
    // 오늘의 일일 과제 조회
    @Query("SELECT dp FROM DailyProblem dp WHERE dp.problemDate = :today AND dp.isActive = true")
    Optional<DailyProblem> findTodayProblem(@Param("today") LocalDate today);
    
    // 이번 주 일일 과제들 조회
    @Query("SELECT dp FROM DailyProblem dp WHERE dp.problemDate BETWEEN :startOfWeek AND :endOfWeek ORDER BY dp.problemDate DESC")
    List<DailyProblem> findThisWeekProblems(@Param("startOfWeek") LocalDate startOfWeek, 
                                           @Param("endOfWeek") LocalDate endOfWeek);
    
    // 이번 달 일일 과제들 조회
    @Query("SELECT dp FROM DailyProblem dp WHERE YEAR(dp.problemDate) = YEAR(CURRENT_DATE) AND MONTH(dp.problemDate) = MONTH(CURRENT_DATE) ORDER BY dp.problemDate DESC")
    List<DailyProblem> findThisMonthProblems();
} 