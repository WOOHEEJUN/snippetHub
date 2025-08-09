package com.snippethub.api.controller;

import com.snippethub.api.domain.Snippet;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.snippet.SnippetCreateRequestDto;
import com.snippethub.api.dto.snippet.SnippetResponseDto;
import com.snippethub.api.service.SnippetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.dto.snippet.SnippetCreateRequestDto;
import com.snippethub.api.dto.snippet.SnippetResponseDto;
import com.snippethub.api.dto.snippet.SnippetUpdateRequestDto;
import com.snippethub.api.service.SnippetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/snippets")
@RequiredArgsConstructor
public class SnippetController {

    private final SnippetService snippetService;

    @PostMapping
    public ResponseEntity<ApiResponse<SnippetResponseDto>> createSnippet(
            @Valid @RequestBody SnippetCreateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            // 입력 데이터 로깅
            System.out.println("스니펫 생성 요청 - 제목: " + requestDto.getTitle());
            System.out.println("코드 길이: " + (requestDto.getCode() != null ? requestDto.getCode().length() : 0));
            
            Snippet newSnippet = snippetService.createSnippet(requestDto, userDetails.getUsername());
            SnippetResponseDto responseDto = new SnippetResponseDto(newSnippet);

            return new ResponseEntity<>(ApiResponse.success("스니펫이 성공적으로 생성되었습니다.", responseDto), HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("스니펫 생성 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(ApiResponse.error("스니펫 생성 중 오류가 발생했습니다: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{snippetId}")
    public ResponseEntity<ApiResponse<SnippetResponseDto>> getSnippet(@PathVariable Long snippetId) {
        Snippet snippet = snippetService.getSnippet(snippetId);
        SnippetResponseDto responseDto = new SnippetResponseDto(snippet);
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponseDto<SnippetResponseDto>>> getSnippets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "LATEST") String sort) {

        Sort.Direction direction = Sort.Direction.DESC;
        String sortProperty = "createdAt";

        if ("POPULAR".equals(sort)) {
            sortProperty = "likeCount";
        } else if ("RUNS".equals(sort)) {
            sortProperty = "runCount";
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));
        Page<Snippet> snippetsPage = snippetService.getSnippets(pageable, language, search);

        PageResponseDto<SnippetResponseDto> responseDto = new PageResponseDto<>(
                snippetsPage.map(SnippetResponseDto::new)
        );

        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @PutMapping("/{snippetId}")
    public ResponseEntity<ApiResponse<SnippetResponseDto>> updateSnippet(
            @PathVariable Long snippetId,
            @Valid @RequestBody SnippetUpdateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        Snippet updatedSnippet = snippetService.updateSnippet(snippetId, requestDto, userDetails.getUsername());
        SnippetResponseDto responseDto = new SnippetResponseDto(updatedSnippet);
        return ResponseEntity.ok(ApiResponse.success("스니펫이 성공적으로 수정되었습니다.", responseDto));
    }

    @DeleteMapping("/{snippetId}")
    public ResponseEntity<ApiResponse<String>> deleteSnippet(
            @PathVariable Long snippetId,
            @AuthenticationPrincipal UserDetails userDetails) {

        snippetService.deleteSnippet(snippetId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("스니펫이 성공적으로 삭제되었습니다."));
    }
}
