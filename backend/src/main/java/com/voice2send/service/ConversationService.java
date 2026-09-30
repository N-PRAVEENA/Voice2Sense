package com.voice2send.service;

import com.voice2send.dto.ConversationDtos.*;
import com.voice2send.entity.Conversation;
import com.voice2send.entity.Language;
import com.voice2send.entity.Message;
import com.voice2send.entity.User;
import com.voice2send.exception.ResourceNotFoundException;
import com.voice2send.exception.UnauthorizedException;
import com.voice2send.repository.ConversationRepository;
import com.voice2send.repository.LanguageRepository;
import com.voice2send.repository.MessageRepository;
import com.voice2send.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final LanguageRepository languageRepository;
    private final TranslationService translationService;

    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(String userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::mapToConversationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConversationResponse createConversation(String userId, CreateConversationRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String langACode = req.getPersonA() != null && req.getPersonA().getLanguage() != null
                ? req.getPersonA().getLanguage() : "en";
        String langBCode = req.getPersonB() != null && req.getPersonB().getLanguage() != null
                ? req.getPersonB().getLanguage() : "ta";

        Language langA = languageRepository.findById(langACode).orElseGet(() -> languageRepository.findAll().get(0));
        Language langB = languageRepository.findById(langBCode).orElseGet(() -> languageRepository.findAll().get(0));

        Conversation conversation = Conversation.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .title(req.getTitle() != null && !req.getTitle().isEmpty() ? req.getTitle() : "Conversation")
                .personAName(req.getPersonA() != null && req.getPersonA().getName() != null ? req.getPersonA().getName() : "Person A")
                .personAInputMethod(req.getPersonA() != null && req.getPersonA().getInputMethod() != null ? req.getPersonA().getInputMethod() : "voice")
                .personALanguage(langA)
                .personBName(req.getPersonB() != null && req.getPersonB().getName() != null ? req.getPersonB().getName() : "Person B")
                .personBOutputMethod(req.getPersonB() != null && req.getPersonB().getOutputMethod() != null ? req.getPersonB().getOutputMethod() : "text")
                .personBLanguage(langB)
                .smartMode(req.getSmartMode() == null || req.getSmartMode())
                .build();

        conversationRepository.save(conversation);
        return mapToConversationResponse(conversation);
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(String id, String userId) {
        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Unauthorized access to this conversation");
        }

        return mapToConversationResponse(conv);
    }

    @Transactional
    public void deleteConversation(String id, String userId) {
        Conversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Unauthorized access to this conversation");
        }

        conversationRepository.delete(conv);
    }

    @Transactional
    public MessageResponse sendMessage(String conversationId, String userId, SendMessageRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Unauthorized access to this conversation");
        }

        String srcCode = req.getOriginalLanguage() != null ? req.getOriginalLanguage() : conv.getPersonALanguage().getCode();
        String tgtCode = req.getTargetLanguage() != null ? req.getTargetLanguage() : conv.getPersonBLanguage().getCode();

        Language srcLang = languageRepository.findById(srcCode).orElse(conv.getPersonALanguage());
        Language tgtLang = languageRepository.findById(tgtCode).orElse(conv.getPersonBLanguage());

        var transRes = translationService.translate(req.getOriginalInput(), srcLang.getCode(), tgtLang.getCode());

        Message message = Message.builder()
                .id(UUID.randomUUID().toString())
                .conversation(conv)
                .senderId(userId)
                .senderName(req.getSenderName() != null ? req.getSenderName() : conv.getPersonAName())
                .originalInput(req.getOriginalInput())
                .inputType(req.getInputType() != null ? req.getInputType() : "text")
                .originalLanguage(srcLang)
                .targetLanguage(tgtLang)
                .translatedContent(transRes.getTranslatedText())
                .outputFormat(req.getOutputFormat() != null ? req.getOutputFormat() : conv.getPersonBOutputMethod())
                .confidence(req.getConfidence() != null ? req.getConfidence() : new BigDecimal("0.950"))
                .build();

        messageRepository.save(message);

        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(conv.getId())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .originalInput(message.getOriginalInput())
                .inputType(message.getInputType())
                .originalLanguage(message.getOriginalLanguage().getCode())
                .targetLanguage(message.getTargetLanguage().getCode())
                .translatedContent(message.getTranslatedContent())
                .outputFormat(message.getOutputFormat())
                .signTokens(transRes.getSignTokens())
                .confidence(message.getConfidence())
                .createdAt(message.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Unauthorized access to this conversation");
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(m -> MessageResponse.builder()
                        .id(m.getId())
                        .conversationId(conversationId)
                        .senderId(m.getSenderId())
                        .senderName(m.getSenderName())
                        .originalInput(m.getOriginalInput())
                        .inputType(m.getInputType())
                        .originalLanguage(m.getOriginalLanguage().getCode())
                        .targetLanguage(m.getTargetLanguage().getCode())
                        .translatedContent(m.getTranslatedContent())
                        .outputFormat(m.getOutputFormat())
                        .confidence(m.getConfidence())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private ConversationResponse mapToConversationResponse(Conversation conv) {
        List<Message> msgs = conv.getMessages();
        Message last = msgs != null && !msgs.isEmpty() ? msgs.get(msgs.size() - 1) : null;

        return ConversationResponse.builder()
                .id(conv.getId())
                .userId(conv.getUser().getId())
                .title(conv.getTitle())
                .personA(ParticipantDto.builder()
                        .name(conv.getPersonAName())
                        .inputMethod(conv.getPersonAInputMethod())
                        .language(conv.getPersonALanguage().getCode())
                        .build())
                .personB(ParticipantDto.builder()
                        .name(conv.getPersonBName())
                        .outputMethod(conv.getPersonBOutputMethod())
                        .language(conv.getPersonBLanguage().getCode())
                        .build())
                .smartMode(conv.isSmartMode())
                .messageCount(msgs != null ? msgs.size() : 0)
                .lastMessage(last != null ? MessageSummaryDto.builder()
                        .content(last.getTranslatedContent())
                        .senderName(last.getSenderName())
                        .timestamp(last.getCreatedAt())
                        .build() : null)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt())
                .build();
    }
}
