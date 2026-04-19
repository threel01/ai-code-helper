package com.componse.aicodehelper.ai;

import com.componse.aicodehelper.ai.guardrail.SafeInputGuardrail;
import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.Result;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.guardrail.InputGuardrails;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

//@AiService
@Service
@InputGuardrails({SafeInputGuardrail.class})
public interface AiCodeHelperService {
    @SystemMessage(fromResource = "system-prompt.txt")
    String chat(String userMsg);

    record Report(String name, List<String> suggestionList){};

    @SystemMessage(fromResource = "system-prompt.txt")
    Report chatForReport(String userMsg);

    @SystemMessage(fromResource = "system-prompt.txt")
    Result<String> chatWithRag(String userMsg);

    @SystemMessage(fromResource = "study-prompt.txt")
    Flux<String> chatStream(@MemoryId int memoryId, @UserMessage String userMsg);


}
