package com.componse.aicodehelper.ai;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiCodeHelper {
    private static final String SYSTEM_MESAGE = "" +
            "你是2026年新高考陕西省的出卷人,结合近两年考点,根据用户给的科目，生成26年完整的考试题目，并在题目下方给出答案，答案包含以下3个内容：" +
            "1.答案+解题思路" +
            "2.题目考点" +
            "3.复习大纲";

    @Resource
    private ChatModel qwenChatModel;

    /**
     * private < protected < public < default
     */
    public String chat(String msg){
        SystemMessage systemMessage = SystemMessage.from(SYSTEM_MESAGE);
        UserMessage from = UserMessage.from(msg);
        ChatResponse chat = qwenChatModel.chat(systemMessage,from);
        AiMessage aiMessage = chat.aiMessage();
        String text = aiMessage.text();
        log.info("aiMessage:{}",text);
        return text;
    }

    //多模态
    public String chatUser(UserMessage userMessage){
        ChatResponse chat = qwenChatModel.chat(userMessage);
        AiMessage aiMessage = chat.aiMessage();
        String text = aiMessage.text();
        log.info("aiMessage:{}",text);
        return text;
    }
}
