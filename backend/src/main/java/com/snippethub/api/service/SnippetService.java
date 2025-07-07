package com.snippethub.api.service;

import com.snippethub.api.domain.Snippet;
import com.snippethub.api.repository.SnippetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SnippetService {

    private final SnippetRepository snippetRepository;

    public SnippetService(SnippetRepository snippetRepository) {
        this.snippetRepository = snippetRepository;
    }

    public List<Snippet> getSnippetsByUserId(Long userId) {
        return snippetRepository.findAll().stream().filter(s -> s.getUser().getId().equals(userId)).toList();
    }

    public Snippet getSnippetById(Long id) {
        return snippetRepository.findById(id).orElseThrow(() -> new RuntimeException("Snippet not found"));
    }

    public List<Snippet> getAllSnippets() {
        return snippetRepository.findAll();
    }

    public Snippet save(Snippet snippet) {
        return snippetRepository.save(snippet);
    }

    public void delete(Long id) {
        snippetRepository.deleteById(id);
    }

}
