package com.snippethub.api.service;

import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.user.UserPasswordChangeRequestDto;
import com.snippethub.api.dto.user.UserProfileUpdateRequestDto;
import com.snippethub.api.dto.user.UserProfileResponseDto.UserStatsDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.PostRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.snippethub.api.service.FileService;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SnippetRepository snippetRepository;
    private final PostRepository postRepository;
    private final FileService fileService;

    public User getUserProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public java.util.Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public UserStatsDto getUserStats(Long userId) {
        long totalSnippets = userRepository.countSnippetsByUserId(userId);
        long totalPosts = userRepository.countPostsByUserId(userId);
        long totalComments = userRepository.countCommentsByUserId(userId);
        long totalLikes = userRepository.countLikesByUserId(userId);
        long totalViews = (userRepository.sumSnippetViewCountsByUserId(userId) != null ? userRepository.sumSnippetViewCountsByUserId(userId) : 0) +
                          (userRepository.sumPostViewCountsByUserId(userId) != null ? userRepository.sumPostViewCountsByUserId(userId) : 0);

        return new UserStatsDto(totalSnippets, totalPosts, totalComments, totalLikes, totalViews);
    }

    @Transactional
    public User updateUserProfile(String email, UserProfileUpdateRequestDto requestDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (requestDto.getNickname() != null && !requestDto.getNickname().isEmpty()) {
            if (userRepository.existsByNickname(requestDto.getNickname()) && !user.getNickname().equals(requestDto.getNickname())) {
                throw new BusinessException(ErrorCode.NICKNAME_DUPLICATION);
            }
            user.updateNickname(requestDto.getNickname());
        }

        if (requestDto.getBio() != null) {
            user.updateBio(requestDto.getBio());
        }

        MultipartFile profileImage = requestDto.getProfileImage();
        if (profileImage != null && !profileImage.isEmpty()) {
            com.snippethub.api.domain.File uploadedFile = fileService.uploadFile(profileImage, "PROFILE_IMAGE", user.getEmail());
            user.updateProfileImage(uploadedFile.getFileUrl());
        }

        return user;
    }

    @Transactional
    public void changeUserPassword(String email, UserPasswordChangeRequestDto requestDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(requestDto.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }

        if (!requestDto.getNewPassword().equals(requestDto.getConfirmNewPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }

        user.updatePassword(passwordEncoder.encode(requestDto.getNewPassword()));
    }

    @Transactional
    public User processOAuth2User(String provider, String providerId, String email, String nickname) {
        // 닉네임 중복 자동 처리
        String baseNickname = nickname;
        int count = 1;
        while (userRepository.existsByNickname(nickname)) {
            nickname = baseNickname + "_" + count;
            count++;
        }
        final String finalNickname = nickname;

        return userRepository.findByProviderAndProviderId(provider, providerId)
            .orElseGet(() -> {
                User user = User.builder()
                        .provider(provider)
                        .providerId(providerId)
                        .email(email)
                        .password(null) // 소셜 로그인 사용자는 비밀번호 null
                        .nickname(finalNickname)
                        .build();
                return userRepository.save(user);
            });
    }

    public Page<Snippet> getMySnippets(String email, Pageable pageable, String status) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        // TODO: Implement status filtering (PUBLIC, PRIVATE, ALL)
        return snippetRepository.findAll(pageable);
    }

    public Page<Post> getMyPosts(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return postRepository.findAll(pageable);
    }

    // 다른 사용자 조회
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    // 다른 사용자의 게시글 목록 조회
    public Page<Post> getUserPosts(Long userId, Pageable pageable) {
        return postRepository.findByAuthorId(userId, pageable);
    }

    // 다른 사용자의 스니펫 목록 조회
    public Page<Snippet> getUserSnippets(Long userId, Pageable pageable) {
        return snippetRepository.findByAuthorId(userId, pageable);
    }

    /**
     * 이메일로 사용자 조회
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * 사용자 랭킹 조회
     */
    public Page<User> getUserRanking(Pageable pageable, String level) {
        if ("ALL".equals(level)) {
            return userRepository.findAllByOrderByPointsDesc(pageable);
        } else {
            return userRepository.findByLevelOrderByPointsDesc(level, pageable);
        }
    }

    /**
     * 등급별 통계 조회
     */
    public LevelStatsResponseDto getLevelStats() {
        long totalUsers = userRepository.count();
        long bronzeUsers = userRepository.countByLevel("BRONZE");
        long silverUsers = userRepository.countByLevel("SILVER");
        long goldUsers = userRepository.countByLevel("GOLD");
        long platinumUsers = userRepository.countByLevel("PLATINUM");
        long diamondUsers = userRepository.countByLevel("DIAMOND");
        long masterUsers = userRepository.countByLevel("MASTER");
        long grandmasterUsers = userRepository.countByLevel("GRANDMASTER");
        long legendUsers = userRepository.countByLevel("LEGEND");

        return new LevelStatsResponseDto(
                totalUsers, bronzeUsers, silverUsers, goldUsers, 
                platinumUsers, diamondUsers, masterUsers, grandmasterUsers, legendUsers
        );
    }

    // DTO 클래스
    public static class LevelStatsResponseDto {
        private long totalUsers;
        private long bronzeUsers;
        private long silverUsers;
        private long goldUsers;
        private long platinumUsers;
        private long diamondUsers;
        private long masterUsers;
        private long grandmasterUsers;
        private long legendUsers;

        public LevelStatsResponseDto(long totalUsers, long bronzeUsers, long silverUsers, 
                                   long goldUsers, long platinumUsers, long diamondUsers,
                                   long masterUsers, long grandmasterUsers, long legendUsers) {
            this.totalUsers = totalUsers;
            this.bronzeUsers = bronzeUsers;
            this.silverUsers = silverUsers;
            this.goldUsers = goldUsers;
            this.platinumUsers = platinumUsers;
            this.diamondUsers = diamondUsers;
            this.masterUsers = masterUsers;
            this.grandmasterUsers = grandmasterUsers;
            this.legendUsers = legendUsers;
        }

        // Getters
        public long getTotalUsers() { return totalUsers; }
        public long getBronzeUsers() { return bronzeUsers; }
        public long getSilverUsers() { return silverUsers; }
        public long getGoldUsers() { return goldUsers; }
        public long getPlatinumUsers() { return platinumUsers; }
        public long getDiamondUsers() { return diamondUsers; }
        public long getMasterUsers() { return masterUsers; }
        public long getGrandmasterUsers() { return grandmasterUsers; }
        public long getLegendUsers() { return legendUsers; }
    }
}
