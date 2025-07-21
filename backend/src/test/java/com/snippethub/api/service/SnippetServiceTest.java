package com.snippethub.api.service;

import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.snippet.SnippetCreateRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SnippetServiceTest {

    @InjectMocks
    private SnippetService snippetService;

    @Mock
    private SnippetRepository snippetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileService fileService;

    @Mock
    private TagService tagService;

    private User testUser;
    private SnippetCreateRequestDto createRequestDto;
    private Snippet testSnippet;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("testuser")
                .build();

        createRequestDto = new SnippetCreateRequestDto();
        createRequestDto.setTitle("Test Snippet");
        createRequestDto.setDescription("This is a test snippet.");
        createRequestDto.setLanguage("JAVA");
        createRequestDto.setCode("public class Main { public static void main(String[] args) {} }");
        createRequestDto.setPublic(true);
        createRequestDto.setTags(Arrays.asList("java", "test"));

        testSnippet = Snippet.builder()
                .author(testUser)
                .title("Test Snippet")
                .description("This is a test snippet.")
                .language("JAVA")
                .code("public class Main { public static void main(String[] args) {} }")
                .isPublic(true)
                .build();
    }

    @Test
    @DisplayName("스니펫 생성 성공")
    void createSnippetSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(tagService.findOrCreateTags(anyList())).thenReturn(Arrays.asList(new com.snippethub.api.domain.Tag("java"), new com.snippethub.api.domain.Tag("test")));
        when(snippetRepository.save(any(Snippet.class))).thenReturn(testSnippet);

        Snippet createdSnippet = snippetService.createSnippet(createRequestDto, 1L);

        assertThat(createdSnippet).isNotNull();
        assertThat(createdSnippet.getTitle()).isEqualTo(createRequestDto.getTitle());
        assertThat(createdSnippet.getAuthor()).isEqualTo(testUser);
        verify(snippetRepository, times(1)).save(any(Snippet.class));
        verify(tagService, times(1)).findOrCreateTags(anyList());
    }

    @Test
    @DisplayName("스니펫 생성 실패 - 사용자 없음")
    void createSnippetFail_UserNotFound() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> snippetService.createSnippet(createRequestDto, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("사용자를 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("스니펫 상세 조회 성공")
    void getSnippetSuccess() {
        when(snippetRepository.findById(anyLong())).thenReturn(Optional.of(testSnippet));

        Snippet foundSnippet = snippetService.getSnippet(1L);

        assertThat(foundSnippet).isNotNull();
        assertThat(foundSnippet.getTitle()).isEqualTo(testSnippet.getTitle());
        assertThat(foundSnippet.getViewCount()).isEqualTo(testSnippet.getViewCount() + 1); // 조회수 증가 확인
    }

    @Test
    @DisplayName("스니펫 상세 조회 실패 - 스니펫 없음")
    void getSnippetFail_SnippetNotFound() {
        when(snippetRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> snippetService.getSnippet(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("스니펫을 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("스니펫 목록 조회 성공 - 전체")
    void getSnippetsSuccess_All() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Snippet> snippets = Arrays.asList(testSnippet);
        Page<Snippet> snippetPage = new PageImpl<>(snippets, pageable, snippets.size());

        when(snippetRepository.findAll(any(Pageable.class))).thenReturn(snippetPage);

        Page<Snippet> result = snippetService.getSnippets(pageable, null, null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo(testSnippet.getTitle());
    }

    @Test
    @DisplayName("스니펫 목록 조회 성공 - 언어 필터링")
    void getSnippetsSuccess_LanguageFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Snippet> snippets = Arrays.asList(testSnippet);
        Page<Snippet> snippetPage = new PageImpl<>(snippets, pageable, snippets.size());

        when(snippetRepository.findByLanguage(eq("JAVA"), any(Pageable.class))).thenReturn(snippetPage);

        Page<Snippet> result = snippetService.getSnippets(pageable, "JAVA", null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getLanguage()).isEqualTo("JAVA");
    }

    @Test
    @DisplayName("스니펫 목록 조회 성공 - 검색어 필터링")
    void getSnippetsSuccess_SearchFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Snippet> snippets = Arrays.asList(testSnippet);
        Page<Snippet> snippetPage = new PageImpl<>(snippets, pageable, snippets.size());

        when(snippetRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCodeContainingIgnoreCase(
                anyString(), anyString(), anyString(), any(Pageable.class))).thenReturn(snippetPage);

        Page<Snippet> result = snippetService.getSnippets(pageable, null, "test");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).containsIgnoringCase("test");
    }

    @Test
    @DisplayName("스니펫 목록 조회 성공 - 언어 및 검색어 필터링")
    void getSnippetsSuccess_LanguageAndSearchFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Snippet> snippets = Arrays.asList(testSnippet);
        Page<Snippet> snippetPage = new PageImpl<>(snippets, pageable, snippets.size());

        when(snippetRepository.findByLanguageAndTitleContainingIgnoreCaseOrLanguageAndDescriptionContainingIgnoreCaseOrLanguageAndCodeContainingIgnoreCase(
                eq("JAVA"), anyString(), eq("JAVA"), anyString(), eq("JAVA"), anyString(), any(Pageable.class))).thenReturn(snippetPage);

        Page<Snippet> result = snippetService.getSnippets(pageable, "JAVA", "test");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getLanguage()).isEqualTo("JAVA");
        assertThat(result.getContent().get(0).getTitle()).containsIgnoringCase("test");
    }
}
