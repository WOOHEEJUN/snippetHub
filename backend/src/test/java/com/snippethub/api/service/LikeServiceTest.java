package com.snippethub.api.service;

import com.snippethub.api.domain.Like;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.repository.LikeRepository;
import com.snippethub.api.repository.PostRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    @InjectMocks
    private LikeService likeService;

    @Mock
    private LikeRepository likeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private SnippetRepository snippetRepository;

    private User testUser;
    private Post testPost;
    private Snippet testSnippet;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("testuser")
                .build();

        testPost = Post.builder()
                .author(testUser)
                .title("Test Post")
                .content("Content")
                .category("GENERAL")
                .isPublic(true)
                .build();

        testSnippet = Snippet.builder()
                .author(testUser)
                .title("Test Snippet")
                .description("Description")
                .language("JAVA")
                .code("Code")
                .isPublic(true)
                .build();
    }

    @Test
    @DisplayName("게시글 좋아요 추가 성공")
    void toggleLikeForPost_AddSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(postRepository.findById(anyLong())).thenReturn(Optional.of(testPost));
        when(likeRepository.findByUserIdAndPostId(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(likeRepository.save(any(Like.class))).thenReturn(any(Like.class));

        boolean isLiked = likeService.toggleLikeForPost(1L, testUser.getEmail());

        assertThat(isLiked).isTrue();
        assertThat(testPost.getLikeCount()).isEqualTo(1); // 좋아요 수 증가 확인
        verify(likeRepository, times(1)).save(any(Like.class));
    }

    @Test
    @DisplayName("게시글 좋아요 취소 성공")
    void toggleLikeForPost_RemoveSuccess() {
        Like existingLike = Like.builder().user(testUser).post(testPost).build();
        testPost.increaseLikeCount(); // Simulate existing like

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(postRepository.findById(anyLong())).thenReturn(Optional.of(testPost));
        when(likeRepository.findByUserIdAndPostId(anyLong(), anyLong())).thenReturn(Optional.of(existingLike));
        doNothing().when(likeRepository).delete(any(Like.class));

        boolean isLiked = likeService.toggleLikeForPost(1L, testUser.getEmail());

        assertThat(isLiked).isFalse();
        assertThat(testPost.getLikeCount()).isEqualTo(0); // 좋아요 수 감소 확인
        verify(likeRepository, times(1)).delete(any(Like.class));
    }

    @Test
    @DisplayName("스니펫 좋아요 추가 성공")
    void toggleLikeForSnippet_AddSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(snippetRepository.findById(anyLong())).thenReturn(Optional.of(testSnippet));
        when(likeRepository.findByUserIdAndSnippetId(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(likeRepository.save(any(Like.class))).thenReturn(any(Like.class));

        boolean isLiked = likeService.toggleLikeForSnippet(1L, testUser.getEmail());

        assertThat(isLiked).isTrue();
        assertThat(testSnippet.getLikeCount()).isEqualTo(1); // 좋아요 수 증가 확인
        verify(likeRepository, times(1)).save(any(Like.class));
    }

    @Test
    @DisplayName("스니펫 좋아요 취소 성공")
    void toggleLikeForSnippet_RemoveSuccess() {
        Like existingLike = Like.builder().user(testUser).snippet(testSnippet).build();
        testSnippet.increaseLikeCount(); // Simulate existing like

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(snippetRepository.findById(anyLong())).thenReturn(Optional.of(testSnippet));
        when(likeRepository.findByUserIdAndSnippetId(anyLong(), anyLong())).thenReturn(Optional.of(existingLike));
        doNothing().when(likeRepository).delete(any(Like.class));

        boolean isLiked = likeService.toggleLikeForSnippet(1L, testUser.getEmail());

        assertThat(isLiked).isFalse();
        assertThat(testSnippet.getLikeCount()).isEqualTo(0); // 좋아요 수 감소 확인
        verify(likeRepository, times(1)).delete(any(Like.class));
    }
}
