package com.componse.aicodehelper.ai.service;

import com.componse.aicodehelper.ai.pojo.ChatHistory;
import jakarta.annotation.Resource;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RedisChatHistoryService {

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @Resource
    private ChatHistoryService chatHistoryService;

    private static final String CHAT_HISTORY_KEY_PREFIX = "chat:history:";
    private static final long EXPIRATION_TIME = 24 * 60 * 60; // 24小时过期

    /**
     * 保存聊天记录到Redis和数据库
     * @param chatHistory 聊天记录
     */
    public void saveChatHistory(ChatHistory chatHistory) {
        // 保存到数据库
        chatHistoryService.save(chatHistory);
        
        // 保存到Redis
        String key = CHAT_HISTORY_KEY_PREFIX + chatHistory.getMemoryId();
        List<ChatHistory> historyList = getChatHistoryFromDb(chatHistory.getMemoryId());
        redisTemplate.opsForValue().set(key, historyList, EXPIRATION_TIME, TimeUnit.SECONDS);
    }

    /**
     * 从Redis获取聊天历史，Redis未命中则从数据库获取
     * @param memoryId 会话ID
     * @return 聊天历史列表
     */
    public List<ChatHistory> getChatHistoryByMemoryId(Integer memoryId) {
        // 先从Redis获取
        String key = CHAT_HISTORY_KEY_PREFIX + memoryId;
        Object result = redisTemplate.opsForValue().get(key);
        if (result != null) {
            return (List<ChatHistory>) result;
        }
        
        // Redis未命中，从数据库获取
        List<ChatHistory> historyList = getChatHistoryFromDb(memoryId);
        // 将数据库数据缓存到Redis
        if (!historyList.isEmpty()) {
            redisTemplate.opsForValue().set(key, historyList, EXPIRATION_TIME, TimeUnit.SECONDS);
        }
        return historyList;
    }

    /**
     * 从数据库获取聊天历史
     * @param memoryId 会话ID
     * @return 聊天历史列表
     */
    private List<ChatHistory> getChatHistoryFromDb(Integer memoryId) {
        return chatHistoryService.findByMemoryId(memoryId);
    }

    /**
     * 删除Redis和数据库中的聊天历史
     * @param memoryId 会话ID
     */
    public void deleteChatHistoryByMemoryId(Integer memoryId) {
        // 删除Redis中的数据
        String key = CHAT_HISTORY_KEY_PREFIX + memoryId;
        redisTemplate.delete(key);
        
        // 删除数据库中的数据
        chatHistoryService.deleteByMemoryId(memoryId);
    }
}