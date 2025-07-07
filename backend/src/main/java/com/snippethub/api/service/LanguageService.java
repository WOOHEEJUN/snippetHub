package com.snippethub.api.service;

import com.snippethub.api.domain.Language;
import com.snippethub.api.repository.LanguageRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LanguageService {
    private final LanguageRepository languageRepository;

    public LanguageService(LanguageRepository languageRepository) {
        this.languageRepository = languageRepository;
    }

    public List<Language> findAll() {
        return languageRepository.findAll();
    }
} 