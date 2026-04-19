package com.componse.aicodehelper.ai.service;

import com.componse.aicodehelper.ai.pojo.ChatHistory;
import com.componse.aicodehelper.ai.repository.ChatHistoryRepository;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 聊天历史服务
 */
@Service
public class ChatHistoryService {

    @Resource
    private ChatHistoryRepository chatHistoryRepository;

    /**
     * 保存聊天记录
     * @param chatHistory 聊天记录
     * @return 保存后的聊天记录
     */
    public ChatHistory save(ChatHistory chatHistory) {
        return chatHistoryRepository.save(chatHistory);
    }

    /**
     * 根据会话ID查询聊天历史
     * @param memoryId 会话ID
     * @return 聊天历史列表
     */
    public List<ChatHistory> findByMemoryId(Integer memoryId) {
        return chatHistoryRepository.findByMemoryIdOrderByCreateTimeDesc(memoryId);
    }

    /**
     * 根据会话ID删除聊天历史
     * @param memoryId 会话ID
     */
    public void deleteByMemoryId(Integer memoryId) {
        chatHistoryRepository.deleteByMemoryId(memoryId);
    }

    /**
     * 获取所有聊天历史
     * @return 聊天历史列表
     */
    public List<ChatHistory> findAll() {
        return chatHistoryRepository.findAll();
    }
}