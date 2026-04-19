package com.componse.aicodehelper.ai.pojo;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 聊天历史实体类
 */
@Data
@Entity
@Table(name = "chat_history")
public class ChatHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 会话ID
     */
    private Integer memoryId;

    /**
     * 用户问题
     */
    @Column(columnDefinition = "text")
    private String userMessage;

    /**
     * AI回答
     */
    @Column(columnDefinition = "text")
    private String aiResponse;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 会话状态
     */
    private String status;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        status = "completed";
    }
}