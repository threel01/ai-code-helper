package com.componse.aicodehelper.ai.repository;

import com.componse.aicodehelper.ai.pojo.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 聊天历史仓库
 */
@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {

    /**
     * 根据会话ID查询聊天历史
     * @param memoryId 会话ID
     * @return 聊天历史列表
     */
    List<ChatHistory> findByMemoryIdOrderByCreateTimeDesc(Integer memoryId);

    /**
     * 根据会话ID删除聊天历史
     * @param memoryId 会话ID
     */
    void deleteByMemoryId(Integer memoryId);
}