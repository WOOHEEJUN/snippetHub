package com.snippethub.api.controller;

import com.snippethub.api.domain.User;
import com.snippethub.api.service.UserService;
import com.snippethub.api.dto.UpdateNicknameRequest;
import com.snippethub.api.dto.UpdatePasswordRequest;
import com.snippethub.api.dto.UserDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me/activity")
    public ResponseEntity<Map<String, Object>> getUserActivity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName(); // This is the email
        User user = userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
        Map<String, Object> activityData = userService.getUserActivity(user.getId());
        return ResponseEntity.ok(activityData);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getUserProfile() {
        User user = getCurrentUser();
        return ResponseEntity.ok(toUserDto(user));
    }

    @PatchMapping("/me/nickname")
    public ResponseEntity<UserDto> updateNickname(@Valid @RequestBody UpdateNicknameRequest request) {
        User user = getCurrentUser();
        User updatedUser = userService.updateNickname(user.getId(), request.getNickname());
        return ResponseEntity.ok(toUserDto(updatedUser));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> updatePassword(@RequestBody UpdatePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
        userService.updatePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
        userService.deleteUser(user.getId());
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setUserId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setNickname(user.getNickname());
        dto.setGrade(user.getGrade());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}

