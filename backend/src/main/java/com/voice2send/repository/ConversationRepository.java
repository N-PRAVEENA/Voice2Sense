package com.voice2send.repository;

import com.voice2send.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    List<Conversation> findByUserIdOrderByUpdatedAtDesc(String userId);

    Page<Conversation> findByUserId(String userId, Pageable pageable);

    @Query("SELECT c FROM Conversation c WHERE c.userId = :userId AND LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY c.updatedAt DESC")
    List<Conversation> searchByUserIdAndTitle(@Param("userId") String userId, @Param("query") String query);

    Optional<Conversation> findByIdAndUserId(String id, String userId);
}
