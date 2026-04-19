package com.componse.aicodehelper.ai;

import dev.langchain4j.service.Result;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class AiCodeHelperServiceTest {
    @Autowired
    private AiCodeHelperService aiCodeHelperService;

    @Test
    void chat() {
        String chat = aiCodeHelperService.chat("用户注册");
        System.out.println(chat);
    }

    @Test
    void chatAiMemory() {
        String chat = aiCodeHelperService.chat("投标场景");
        System.out.println(chat);
        String chat2 = aiCodeHelperService.chat("我刚问的什么问题");
        System.out.println(chat2);
    }

    @Test
    void chatForReport() {
        AiCodeHelperService.Report mysqlReport = aiCodeHelperService.chatForReport("mysql");
        System.out.println(mysqlReport);
    }

    @Test
    void chatWithRag() {
        Result<String> ragResult = aiCodeHelperService.chatWithRag("怎么学习JAVA");
        System.out.println(ragResult.sources());
        System.out.println(ragResult.content());
    }

    @Test
    void chatWithTools() {
        String toolsResult =aiCodeHelperService.chat("JAVA常见面试题");
        System.out.println(toolsResult);
    }

    @Test
    void chatWithMcp() {
        String chat = aiCodeHelperService.chat("汉得股票涨幅原因");
        System.out.println(chat);
    }

    @Test
    void chatWithGuardrail() {
        String chat = aiCodeHelperService.chat("living the world");
        System.out.println(chat);
    }

}