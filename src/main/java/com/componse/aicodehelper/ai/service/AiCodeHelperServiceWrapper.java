package com.componse.aicodehelper.ai.service;

import com.componse.aicodehelper.ai.AiCodeHelperService;
import com.componse.aicodehelper.ai.pojo.ChatHistory;
import com.componse.aicodehelper.ai.repository.ChatHistoryRepository;
import dev.langchain4j.service.Result;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SignalType;

import java.util.concurrent.atomic.AtomicReference;

/**
 * AiCodeHelperService包装类，用于保存聊天记录
 */
@Service
public class AiCodeHelperServiceWrapper implements AiCodeHelperService {

    @Resource(name = "aiCodeHelperServiceOriginal")
    private AiCodeHelperService aiCodeHelperService;

    @Resource
    private RedisChatHistoryService redisChatHistoryService;
    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    @Override
    public String chat(String userMsg) {
        String response = aiCodeHelperService.chat(userMsg);
        saveChatHistory(0, userMsg, response);
        return response;
    }

    @Override
    public Report chatForReport(String userMsg) {
        Report report = aiCodeHelperService.chatForReport(userMsg);
        saveChatHistory(0, userMsg, report.toString());
        return report;
    }

    @Override
    public Result<String> chatWithRag(String userMsg) {
        Result<String> result = aiCodeHelperService.chatWithRag(userMsg);
        saveChatHistory(0, userMsg, result.content());
        return result;
    }

    @Override
    public Flux<String> chatStream(int memoryId, String userMsg) {
        AtomicReference<StringBuilder> responseBuilder = new AtomicReference<>(new StringBuilder());

        return aiCodeHelperService.chatStream(memoryId, userMsg)
                .doOnNext(chunk -> {
                    responseBuilder.get().append(chunk);
                })
                .doFinally(signalType -> {
                    if (signalType == SignalType.ON_COMPLETE) {
                        String response = responseBuilder.get().toString();
                        saveChatHistory(memoryId, userMsg, response);
                    }
                });
    }

    /**
     * 保存聊天历史
     * @param memoryId 会话ID
     * @param userMsg 用户消息
     * @param response AI响应
     */
    private void saveChatHistory(int memoryId, String userMsg, String response) {
        ChatHistory chatHistory = new ChatHistory();
        chatHistory.setMemoryId(memoryId);
        chatHistory.setUserMessage(userMsg);
        chatHistory.setAiResponse(response);
        chatHistoryRepository.save(chatHistory);
        redisChatHistoryService.saveChatHistory(chatHistory);
    }
}