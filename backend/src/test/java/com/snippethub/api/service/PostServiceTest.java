package com.snippethub.api.service;

import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.post.PostCreateRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.repository.PostRepository;
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
class PostServiceTest {

    @InjectMocks
    private PostService postService;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TagService tagService;

    private User testUser;
    private PostCreateRequestDto createRequestDto;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("testuser")
                .build();

        createRequestDto = new PostCreateRequestDto();
        createRequestDto.setTitle("Test Post");
        createRequestDto.setContent("This is a test post.");
        createRequestDto.setCategory("GENERAL");
        createRequestDto.setPublic(true);
        createRequestDto.setTags(Arrays.asList("spring", "boot"));

        testPost = Post.builder()
                .author(testUser)
                .title("Test Post")
                .content("This is a test post.")
                .category("GENERAL")
                .isPublic(true)
                .build();
    }

    @Test
    @DisplayName("게시글 생성 성공")
    void createPostSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(tagService.findOrCreateTags(anyList())).thenReturn(Arrays.asList(new com.snippethub.api.domain.Tag("spring"), new com.snippethub.api.domain.Tag("boot")));
        when(postRepository.save(any(Post.class))).thenReturn(testPost);

        Post createdPost = postService.createPost(createRequestDto, testUser.getEmail());

        assertThat(createdPost).isNotNull();
        assertThat(createdPost.getTitle()).isEqualTo(createRequestDto.getTitle());
        assertThat(createdPost.getAuthor()).isEqualTo(testUser);
        verify(postRepository, times(1)).save(any(Post.class));
        verify(tagService, times(1)).findOrCreateTags(anyList());
    }

    @Test
    @DisplayName("게시글 생성 실패 - 사용자 없음")
    void createPostFail_UserNotFound() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.createPost(createRequestDto, testUser.getEmail()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("사용자를 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("게시글 상세 조회 성공")
    void getPostSuccess() {
        when(postRepository.findById(anyLong())).thenReturn(Optional.of(testPost));

        Post foundPost = postService.getPost(1L);

        assertThat(foundPost).isNotNull();
        assertThat(foundPost.getTitle()).isEqualTo(testPost.getTitle());
        assertThat(foundPost.getViewCount()).isEqualTo(testPost.getViewCount() + 1); // 조회수 증가 확인
    }

    @Test
    @DisplayName("게시글 상세 조회 실패 - 게시글 없음")
    void getPostFail_PostNotFound() {
        when(postRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getPost(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("게시글을 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("게시글 목록 조회 성공 - 전체")
    void getPostsSuccess_All() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Post> posts = Arrays.asList(testPost);
        Page<Post> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(postRepository.findAll(any(Pageable.class))).thenReturn(postPage);

        Page<Post> result = postService.getPosts(pageable, null, null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo(testPost.getTitle());
    }

    @Test
    @DisplayName("게시글 목록 조회 성공 - 카테고리 필터링")
    void getPostsSuccess_CategoryFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Post> posts = Arrays.asList(testPost);
        Page<Post> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(postRepository.findByCategory(eq("GENERAL"), any(Pageable.class))).thenReturn(postPage);

        Page<Post> result = postService.getPosts(pageable, "GENERAL", null);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getCategory()).isEqualTo("GENERAL");
    }

    @Test
    @DisplayName("게시글 목록 조회 성공 - 검색어 필터링")
    void getPostsSuccess_SearchFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Post> posts = Arrays.asList(testPost);
        Page<Post> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(postRepository.findByTitleContainingIgnoreCase(anyString(), any(Pageable.class))).thenReturn(postPage);

        Page<Post> result = postService.getPosts(pageable, null, "test");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).containsIgnoringCase("test");
    }

    @Test
    @DisplayName("게시글 목록 조회 성공 - 카테고리 및 검색어 필터링")
    void getPostsSuccess_CategoryAndSearchFiltered() {
        Pageable pageable = PageRequest.of(0, 10);
        List<Post> posts = Arrays.asList(testPost);
        Page<Post> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(postRepository.findByCategoryAndTitleContainingIgnoreCase(
                eq("GENERAL"), anyString(), any(Pageable.class))).thenReturn(postPage);

        Page<Post> result = postService.getPosts(pageable, "GENERAL", "test");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getCategory()).isEqualTo("GENERAL");
        assertThat(result.getContent().get(0).getTitle()).containsIgnoringCase("test");
    }
}
