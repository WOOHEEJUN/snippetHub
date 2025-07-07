package com.snippethub.api.controller;

import com.snippethub.api.domain.User;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.service.SnippetService;
import com.snippethub.api.service.UserService;
import com.snippethub.api.dto.SnippetDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/snippets")
public class SnippetController {

    private final SnippetService snippetService;
    private final UserService userService;

    public SnippetController(SnippetService snippetService, UserService userService) {
        this.snippetService = snippetService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<SnippetDto>> getAllSnippets() {
        List<Snippet> snippets = snippetService.getAllSnippets();
        return ResponseEntity.ok(snippets.stream().map(this::toSnippetDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SnippetDto> getSnippet(@PathVariable Long id) {
        return ResponseEntity.ok(toSnippetDto(snippetService.getSnippetById(id)));
    }

    @PostMapping
    public ResponseEntity<SnippetDto> createSnippet(@Valid @RequestBody Snippet snippet) {
        User user = getCurrentUser();
        snippet.setUser(user);
        return ResponseEntity.ok(toSnippetDto(snippetService.save(snippet)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SnippetDto> updateSnippet(@PathVariable Long id, @Valid @RequestBody Snippet snippet) {
        User user = getCurrentUser();
        Snippet existing = snippetService.getSnippetById(id);
        if (!existing.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        snippet.setId(id);
        snippet.setUser(user);
        return ResponseEntity.ok(toSnippetDto(snippetService.save(snippet)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSnippet(@PathVariable Long id) {
        User user = getCurrentUser();
        Snippet existing = snippetService.getSnippetById(id);
        if (!existing.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        snippetService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/snippets")
    public ResponseEntity<List<SnippetDto>> getMySnippets() {
        User user = getCurrentUser();
        List<Snippet> snippets = snippetService.getSnippetsByUserId(user.getId());
        return ResponseEntity.ok(snippets.stream().map(this::toSnippetDto).toList());
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private SnippetDto toSnippetDto(Snippet snippet) {
        SnippetDto dto = new SnippetDto();
        dto.setSnippetId(snippet.getId());
        dto.setTitle(snippet.getTitle());
        dto.setDescription(snippet.getDescription());
        dto.setLanguage(snippet.getLanguage());
        dto.setCode(snippet.getCode());
        dto.setCreatedAt(snippet.getCreatedAt());
        dto.setUpdatedAt(snippet.getUpdatedAt());
        SnippetDto.AuthorDto author = new SnippetDto.AuthorDto();
        author.setUserId(snippet.getUser().getId());
        author.setNickname(snippet.getUser().getNickname());
        dto.setAuthor(author);
        return dto;
    }
}
