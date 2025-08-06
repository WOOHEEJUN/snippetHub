package com.snippethub.api.service;

import com.snippethub.api.domain.Comment;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.CommentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.repository.CommentRepository;
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

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @InjectMocks
    private CommentService commentService;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private SnippetRepository snippetRepository;

    private User testUser;
    private Post testPost;
    private Snippet testSnippet;
    private CommentDto.CommentRequestDto createRequestDto;

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

        createRequestDto = new CommentDto.CommentRequestDto("Test Comment", null);
    }

    @Test
    @DisplayName("게시글에 댓글 생성 성공")
    void createCommentForPostSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(postRepository.findById(anyLong())).thenReturn(Optional.of(testPost));
        when(commentRepository.save(any(Comment.class))).thenReturn(Comment.builder().id(1L).content(createRequestDto.getContent()).author(testUser).post(testPost).build());

        CommentDto.CommentResponseDto createdComment = commentService.createPostComment(1L, createRequestDto, testUser.getEmail());

        assertThat(createdComment).isNotNull();
        assertThat(createdComment.getContent()).isEqualTo(createRequestDto.getContent());
        assertThat(createdComment.getAuthorNickname()).isEqualTo(testUser.getNickname());
        verify(commentRepository, times(1)).save(any(Comment.class));
    }

    @Test
    @DisplayName("스니펫에 댓글 생성 성공")
    void createCommentForSnippetSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(snippetRepository.findById(anyLong())).thenReturn(Optional.of(testSnippet));
        when(commentRepository.save(any(Comment.class))).thenReturn(Comment.builder().id(1L).content(createRequestDto.getContent()).author(testUser).snippet(testSnippet).build());

        CommentDto.CommentResponseDto createdComment = commentService.createSnippetComment(1L, createRequestDto, testUser.getEmail());

        assertThat(createdComment).isNotNull();
        assertThat(createdComment.getContent()).isEqualTo(createRequestDto.getContent());
        assertThat(createdComment.getAuthorNickname()).isEqualTo(testUser.getNickname());
        verify(commentRepository, times(1)).save(any(Comment.class));
    }

    @Test
    @DisplayName("게시글 댓글 조회 성공")
    void getCommentsForPostSuccess() {
        Comment comment1 = Comment.builder().id(1L).author(testUser).post(testPost).content("Comment 1").build();
        Comment comment2 = Comment.builder().id(2L).author(testUser).post(testPost).content("Comment 2").build();
        Page<Comment> commentPage = new PageImpl<>(Arrays.asList(comment1, comment2));
        when(commentRepository.findByPostId(anyLong(), any(Pageable.class))).thenReturn(commentPage);

        Page<CommentDto.CommentResponseDto> comments = commentService.getPostComments(1L, PageRequest.of(0, 10));

        assertThat(comments).hasSize(2);
        assertThat(comments.getContent().get(0).getContent()).isEqualTo("Comment 1");
    }

    @Test
    @DisplayName("스니펫 댓글 조회 성공")
    void getCommentsForSnippetSuccess() {
        Comment comment1 = Comment.builder().id(1L).author(testUser).snippet(testSnippet).content("Comment 1").build();
        Comment comment2 = Comment.builder().id(2L).author(testUser).snippet(testSnippet).content("Comment 2").build();
        Page<Comment> commentPage = new PageImpl<>(Arrays.asList(comment1, comment2));
        when(commentRepository.findBySnippetId(anyLong(), any(Pageable.class))).thenReturn(commentPage);

        Page<CommentDto.CommentResponseDto> comments = commentService.getSnippetComments(1L, PageRequest.of(0, 10));

        assertThat(comments).hasSize(2);
        assertThat(comments.getContent().get(0).getContent()).isEqualTo("Comment 1");
    }
}
