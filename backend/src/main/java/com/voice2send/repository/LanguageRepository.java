package com.voice2send.repository;

import com.voice2send.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LanguageRepository extends JpaRepository<Language, String> {
    List<Language> findBySupportedTrue();
}
