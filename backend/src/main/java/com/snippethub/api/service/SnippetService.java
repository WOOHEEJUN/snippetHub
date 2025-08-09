package com.snippethub.api.service;

import com.snippethub.api.domain.File;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.Tag;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.snippet.SnippetCreateRequestDto;
import com.snippethub.api.dto.snippet.SnippetUpdateRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SnippetService {

    private final SnippetRepository snippetRepository;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final TagService tagService;

    @Transactional
    public Snippet createSnippet(SnippetCreateRequestDto requestDto, String email) {
        try {
            System.out.println("=== 스니펫 생성 서비스 시작 ===");
            System.out.println("요청자 이메일: " + email);
            System.out.println("제목: " + requestDto.getTitle());
            System.out.println("언어: " + requestDto.getLanguage());
            System.out.println("코드 길이: " + (requestDto.getCode() != null ? requestDto.getCode().length() : 0));
            System.out.println("설명 길이: " + (requestDto.getDescription() != null ? requestDto.getDescription().length() : 0));
            System.out.println("공개 여부: " + requestDto.isPublic());
            System.out.println("태그 개수: " + (requestDto.getTags() != null ? requestDto.getTags().size() : 0));
            
            User author = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
            System.out.println("사용자 조회 완료: " + author.getNickname());

            Snippet snippet = Snippet.builder()
                    .title(requestDto.getTitle())
                    .description(requestDto.getDescription())
                    .language(requestDto.getLanguage())
                    .code(requestDto.getCode())
                    .isPublic(requestDto.isPublic())
                    .author(author)
                    .build();
            System.out.println("스니펫 객체 생성 완료");

            if (requestDto.getTags() != null && !requestDto.getTags().isEmpty()) {
                System.out.println("태그 처리 시작: " + requestDto.getTags());
                List<Tag> tags = tagService.findOrCreateTags(requestDto.getTags());
                snippet.getTags().addAll(tags);
                System.out.println("태그 처리 완료");
            }

            System.out.println("데이터베이스 저장 시작");
            Snippet savedSnippet = snippetRepository.save(snippet);
            System.out.println("데이터베이스 저장 완료 - ID: " + savedSnippet.getId());

            if (requestDto.getFiles() != null && !requestDto.getFiles().isEmpty()) {
                System.out.println("파일 업로드 시작 - 파일 개수: " + requestDto.getFiles().size());
                for (MultipartFile file : requestDto.getFiles()) {
                    fileService.uploadFile(file, "SNIPPET_ATTACHMENT", author.getEmail(), savedSnippet);
                }
                System.out.println("파일 업로드 완료");
            }

            System.out.println("=== 스니펫 생성 서비스 완료 ===");
            return savedSnippet;
        } catch (Exception e) {
            System.err.println("=== 스니펫 생성 서비스 에러 ===");
            System.err.println("에러 메시지: " + e.getMessage());
            System.err.println("에러 클래스: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public Snippet getSnippet(Long snippetId) {
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));
        snippet.increaseViewCount();
        return snippet;
    }

    public Page<Snippet> getSnippets(Pageable pageable, String language, String search) {
        // 검색어가 비어있거나 null인 경우 처리
        if (search != null && search.trim().isEmpty()) {
            search = null;
        }
        
        if (language != null && search != null) {
            // 언어 + 검색어 조합
            return snippetRepository.findByLanguageAndTitleContainingIgnoreCase(language, search, pageable);
        } else if (language != null) {
            // 언어별 필터링만
            return snippetRepository.findByLanguage(language, pageable);
        } else if (search != null) {
            // 검색어만 (제목에서만 검색)
            return snippetRepository.findByTitleContainingIgnoreCase(search, pageable);
        } else {
            // 전체 조회
            return snippetRepository.findAll(pageable);
        }
    }

    @Transactional
    public Snippet updateSnippet(Long snippetId, SnippetUpdateRequestDto requestDto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));

        if (!snippet.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        snippet.updateSnippet(requestDto.getTitle(), requestDto.getDescription(), requestDto.getLanguage(), requestDto.getCode(), requestDto.isPublic());

        if (requestDto.getTags() != null) {
            snippet.getTags().clear();
            List<Tag> tags = tagService.findOrCreateTags(requestDto.getTags());
            snippet.getTags().addAll(tags);
        }

        // TODO: Handle file updates (add/remove)

        return snippet;
    }

    @Transactional
    public void deleteSnippet(Long snippetId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));

        if (!snippet.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        try {
            // 관련 데이터들을 먼저 삭제해야 함
            deleteSnippetDependencies(snippetId);
            
            // 스니펫 삭제
            snippetRepository.delete(snippet);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SNIPPET_DELETE_FAILED);
        }
    }
    
    /**
     * 스니펫 삭제 전 관련 데이터들을 삭제
     */
    private void deleteSnippetDependencies(Long snippetId) {
        // TODO: 실제 구현에서는 다음 서비스들을 주입받아 사용해야 함
        // - LikeService: 스니펫의 모든 좋아요 삭제
        // - CommentService: 스니펫의 모든 댓글 삭제
        // - FileService: 스니펫의 모든 첨부파일 삭제
        
        // 임시로 로그만 출력 (실제로는 repository를 통해 삭제)
        System.out.println("스니펫 ID " + snippetId + "의 관련 데이터를 삭제합니다.");
        
        // 실제 구현 예시:
        // likeService.deleteAllBySnippetId(snippetId);
        // commentService.deleteAllBySnippetId(snippetId);
        // fileService.deleteAllBySnippetId(snippetId);
    }
}

