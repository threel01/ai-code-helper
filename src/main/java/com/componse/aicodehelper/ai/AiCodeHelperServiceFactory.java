package com.componse.aicodehelper.ai;

import com.componse.aicodehelper.ai.tools.InterviewQuestionTool;

import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.service.AiServices;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiCodeHelperServiceFactory {

    @Resource
    private ChatModel myQwenChatModel;;
    @Resource
    private ContentRetriever contentRetriever;
    @Resource
    private McpToolProvider mcpToolProvider;
    @Resource
    private StreamingChatModel qwenStreamingChatModel;
    @Bean(name = "aiCodeHelperServiceOriginal")
    public AiCodeHelperService aiCodeHelperService() {
        //会话记忆，保存10条
        MessageWindowChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(10);
        //构造服务对象
        AiCodeHelperService aiCodeHelperService = AiServices.builder(AiCodeHelperService.class)
                .chatModel(myQwenChatModel)
                .streamingChatModel(qwenStreamingChatModel)//流式输出
                .chatMemory(chatMemory)//会话记忆
                .chatMemoryProvider(memoryId ->MessageWindowChatMemory.withMaxMessages(10))//每个会话独立存储
                .contentRetriever(contentRetriever)//RAG 内容检索器
                .tools(new InterviewQuestionTool())//工具调用
                .toolProvider(mcpToolProvider) //mcp工具提供器，加载工具调用
                .build();
        return aiCodeHelperService;
    }

}