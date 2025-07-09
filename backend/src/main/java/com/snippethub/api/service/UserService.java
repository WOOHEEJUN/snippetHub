package com.snippethub.api.service;

import com.snippethub.api.domain.User;
import com.snippethub.api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import com.snippethub.api.service.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PostService postService;
    private final SnippetService snippetService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
                      PostService postService, SnippetService snippetService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.postService = postService;
        this.snippetService = snippetService;
    }

    @Transactional
    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already in use.");
        }
        if (userRepository.findByNickname(user.getNickname()).isPresent()) {
            throw new IllegalStateException("Nickname already in use.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Map<String, Object> getUserActivity(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        // 실제 게시글 수 계산 (자유게시글 + 스니펫)
        long freePostCount = postService.getPostCountByUserId(userId);
        long snippetCount = snippetService.getSnippetCountByUserId(userId);
        long totalPostCount = freePostCount + snippetCount;
        
        return Map.of(
            "grade", user.getGrade(),
            "freePostCount", freePostCount,    // 자유게시글 수
            "snippetCount", snippetCount,      // 스니펫 수
            "totalPostCount", totalPostCount,  // 전체 게시글 수
            "commentCount", 0,  // TODO: CommentService 구현 후 실제 값으로 변경
            "likesReceived", 0  // TODO: LikeService 구현 후 실제 값으로 변경
        );
    }

    @Transactional
    public User updateNickname(Long userId, String newNickname) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (userRepository.findByNickname(newNickname).isPresent() && !user.getNickname().equals(newNickname)) {
            throw new IllegalStateException("Nickname already in use.");
        }
        user.setNickname(newNickname);
        return userRepository.save(user);
    }

    @Transactional
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadCredentialsException("Invalid current password.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}

