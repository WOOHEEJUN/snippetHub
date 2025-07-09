package com.snippethub.api.controller;

import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.User;
import com.snippethub.api.service.PostService;
import com.snippethub.api.service.SnippetService;
import com.snippethub.api.service.UserService;
import com.snippethub.api.dto.PostDto;
import com.snippethub.api.dto.PostCountDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {
    private final PostService postService;
    private final UserService userService;
    private final SnippetService snippetService;

    public PostController(PostService postService, UserService userService, SnippetService snippetService) {
        this.postService = postService;
        this.userService = userService;
        this.snippetService = snippetService;
    }

    @GetMapping
    public ResponseEntity<List<PostDto>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts.stream().map(this::toPostDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(toPostDto(postService.getPostById(id)));
    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(@Valid @RequestBody Post post) {
        User user = getCurrentUser();
        post.setUser(user);
        return ResponseEntity.ok(toPostDto(postService.save(post)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostDto> updatePost(@PathVariable Long id, @Valid @RequestBody Post post) {
        User user = getCurrentUser();
        Post existing = postService.getPostById(id);
        if (!existing.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        post.setId(id);
        post.setUser(user);
        return ResponseEntity.ok(toPostDto(postService.save(post)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        User user = getCurrentUser();
        Post existing = postService.getPostById(id);
        if (!existing.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        postService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/posts")
    public ResponseEntity<List<PostDto>> getMyPosts() {
        User user = getCurrentUser();
        List<Post> posts = postService.getPostsByUserId(user.getId());
        return ResponseEntity.ok(posts.stream().map(this::toPostDto).toList());
    }
    
    @GetMapping("/users/me/posts/count")
    public ResponseEntity<PostCountDto> getMyPostCount() {
        User user = getCurrentUser();
        long freePosts = postService.getPostCountByUserId(user.getId());
        long snippetPosts = snippetService.getSnippetCountByUserId(user.getId());
        PostCountDto countDto = new PostCountDto();
        countDto.setFreePosts(freePosts);
        countDto.setSnippetPosts(snippetPosts);
        countDto.setTotalPosts(freePosts + snippetPosts);
        return ResponseEntity.ok(countDto);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private PostDto toPostDto(Post post) {
        PostDto dto = new PostDto();
        dto.setPostId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        PostDto.AuthorDto author = new PostDto.AuthorDto();
        author.setUserId(post.getUser().getId());
        author.setNickname(post.getUser().getNickname());
        dto.setAuthor(author);
        return dto;
    }
}
