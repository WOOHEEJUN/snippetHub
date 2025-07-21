package com.snippethub.api.service;

import com.snippethub.api.domain.User;
import com.snippethub.api.dto.user.UserPasswordChangeRequestDto;
import com.snippethub.api.dto.user.UserProfileResponseDto;
import com.snippethub.api.dto.user.UserProfileUpdateRequestDto;
import com.snippethub.api.exception.BusinessException;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SnippetRepository snippetRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private FileService fileService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("encodedPassword")
                .nickname("testuser")
                .build();
        testUser.setIsVerified(true);
    }

    @Test
    @DisplayName("프로필 조회 성공")
    void getUserProfileSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(userRepository.countSnippetsByUserId(anyLong())).thenReturn(5L);
        when(userRepository.countPostsByUserId(anyLong())).thenReturn(3L);
        when(userRepository.countCommentsByUserId(anyLong())).thenReturn(10L);
        when(userRepository.countLikesByUserId(anyLong())).thenReturn(15L);
        when(userRepository.sumSnippetViewCountsByUserId(anyLong())).thenReturn(100L);
        when(userRepository.sumPostViewCountsByUserId(anyLong())).thenReturn(50L);

        User foundUser = userService.getUserProfile(1L);
        UserProfileResponseDto.UserStatsDto stats = userService.getUserStats(1L);

        assertThat(foundUser).isNotNull();
        assertThat(foundUser.getEmail()).isEqualTo(testUser.getEmail());
        assertThat(stats.getTotalSnippets()).isEqualTo(5L);
        assertThat(stats.getTotalPosts()).isEqualTo(3L);
        assertThat(stats.getTotalComments()).isEqualTo(10L);
        assertThat(stats.getTotalLikes()).isEqualTo(15L);
        assertThat(stats.getTotalViews()).isEqualTo(150L);
    }

    @Test
    @DisplayName("프로필 조회 실패 - 사용자 없음")
    void getUserProfileFail_UserNotFound() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfile(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("사용자를 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("프로필 업데이트 성공 - 닉네임 및 자기소개")
    void updateUserProfileSuccess_NicknameAndBio() {
        UserProfileUpdateRequestDto requestDto = new UserProfileUpdateRequestDto();
        requestDto.setNickname("newnickname");
        requestDto.setBio("new bio");

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(userRepository.existsByNickname(anyString())).thenReturn(false);

        User updatedUser = userService.updateUserProfile(1L, requestDto);

        assertThat(updatedUser.getNickname()).isEqualTo("newnickname");
        assertThat(updatedUser.getBio()).isEqualTo("new bio");
    }

    @Test
    @DisplayName("프로필 업데이트 성공 - 프로필 이미지")
    void updateUserProfileSuccess_ProfileImage() {
        UserProfileUpdateRequestDto requestDto = new UserProfileUpdateRequestDto();
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.isEmpty()).thenReturn(false);
        requestDto.setProfileImage(mockFile);

        com.snippethub.api.domain.File uploadedFile = com.snippethub.api.domain.File.builder()
                .fileUrl("http://example.com/image.jpg")
                .build();

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(fileService.uploadFile(any(MultipartFile.class), anyString(), anyLong())).thenReturn(uploadedFile);

        User updatedUser = userService.updateUserProfile(1L, requestDto);

        assertThat(updatedUser.getProfileImage()).isEqualTo("http://example.com/image.jpg");
    }

    @Test
    @DisplayName("프로필 업데이트 실패 - 닉네임 중복")
    void updateUserProfileFail_NicknameDuplicate() {
        UserProfileUpdateRequestDto requestDto = new UserProfileUpdateRequestDto();
        requestDto.setNickname("existingnickname");

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(userRepository.existsByNickname(anyString())).thenReturn(true);

        assertThatThrownBy(() -> userService.updateUserProfile(1L, requestDto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("이미 사용중인 닉네임입니다.");
    }

    @Test
    @DisplayName("비밀번호 변경 성공")
    void changeUserPasswordSuccess() {
        UserPasswordChangeRequestDto requestDto = new UserPasswordChangeRequestDto();
        requestDto.setCurrentPassword("password123");
        requestDto.setNewPassword("newpassword123!@#");
        requestDto.setConfirmNewPassword("newpassword123!@#");

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("newencodedpassword");

        userService.changeUserPassword(1L, requestDto);

        assertThat(testUser.getPassword()).isEqualTo("newencodedpassword");
    }

    @Test
    @DisplayName("비밀번호 변경 실패 - 현재 비밀번호 불일치")
    void changeUserPasswordFail_CurrentPasswordMismatch() {
        UserPasswordChangeRequestDto requestDto = new UserPasswordChangeRequestDto();
        requestDto.setCurrentPassword("wrongpassword");
        requestDto.setNewPassword("newpassword123!@#");
        requestDto.setConfirmNewPassword("newpassword123!@#");

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> userService.changeUserPassword(1L, requestDto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("비밀번호가 일치하지 않습니다.");
    }

    @Test
    @DisplayName("비밀번호 변경 실패 - 새 비밀번호 불일치")
    void changeUserPasswordFail_NewPasswordMismatch() {
        UserPasswordChangeRequestDto requestDto = new UserPasswordChangeRequestDto();
        requestDto.setCurrentPassword("password123");
        requestDto.setNewPassword("newpassword123!@#");
        requestDto.setConfirmNewPassword("mismatchedpassword");

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThatThrownBy(() -> userService.changeUserPassword(1L, requestDto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("비밀번호가 일치하지 않습니다.");
    }

    @Test
    @DisplayName("내 스니펫 목록 조회 성공")
    void getMySnippetsSuccess() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<com.snippethub.api.domain.Snippet> snippetPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(snippetRepository.findAll(any(Pageable.class))).thenReturn(snippetPage);

        Page<com.snippethub.api.domain.Snippet> result = userService.getMySnippets(1L, pageable, "ALL");

        assertThat(result).isNotNull();
        verify(snippetRepository, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @DisplayName("내 게시글 목록 조회 성공")
    void getMyPostsSuccess() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<com.snippethub.api.domain.Post> postPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(postRepository.findAll(any(Pageable.class))).thenReturn(postPage);

        Page<com.snippethub.api.domain.Post> result = userService.getMyPosts(1L, pageable);

        assertThat(result).isNotNull();
        verify(postRepository, times(1)).findAll(any(Pageable.class));
    }
}
