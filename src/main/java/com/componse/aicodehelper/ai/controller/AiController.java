package com.componse.aicodehelper.ai.controller;

import com.componse.aicodehelper.ai.pojo.ChatHistory;
import com.componse.aicodehelper.ai.service.AiCodeHelperServiceWrapper;
import com.componse.aicodehelper.ai.service.RedisChatHistoryService;
import com.componse.aicodehelper.ai.service.ChatHistoryService;
import jakarta.annotation.Resource;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/ai")
public class AiController {
    @Resource
    private AiCodeHelperServiceWrapper aiCodeHelperService;

    @Resource
    private RedisChatHistoryService redisChatHistoryService;

    @Resource
    private ChatHistoryService chatHistoryService;

    @GetMapping("/chat")
    public Flux<ServerSentEvent<String>> chat(int memoryId, String userMsg) {
        return aiCodeHelperService.chatStream(memoryId, userMsg)
                .map(chunk -> ServerSentEvent.<String>builder()
                        .data(chunk)
                        .build());

    }

    @GetMapping("/history/{memoryId}")
    public List<ChatHistory> getChatHistory(@PathVariable int memoryId) {
        return redisChatHistoryService.getChatHistoryByMemoryId(memoryId);
    }

    @GetMapping("/history")
    public List<ChatHistory> getAllChatHistory() {
        return chatHistoryService.findAll();
    }

    @GetMapping("/history/delete/{memoryId}")
    public String deleteChatHistory(@PathVariable int memoryId) {
        redisChatHistoryService.deleteChatHistoryByMemoryId(memoryId);
        return "删除成功";
    }

}