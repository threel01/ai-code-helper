package com.componse.aicodehelper.ai;

import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import jakarta.annotation.Resource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class AiCodeHelperTest {
    @Resource
    private AiCodeHelper aiCodeHelper;

    @Test
    void chat() {
        String chat = aiCodeHelper.chat("语文");
    }

    @Test
    void chatUser(){
        UserMessage userMessage = UserMessage.from(
                TextContent.from("这个瓶子是什么颜色？"),
                ImageContent.from("https://image.baidu.com/search/detail?adpicid=0&b_applid=8114535677515387951&bdtype=0&commodity=&copyright=&cs=526229871%2C3795182069&di=7565560840087142401&fr=click-pic&fromurl=http%253A%252F%252Fxsj.699pic.com%252Ftupian%252F0imj62.html&gsm=1e&hd=&height=0&hot=&ic=&ie=utf-8&imgformat=&imgratio=&imgspn=0&is=0%2C0&isImgSet=&latest=&lid=&lm=&objurl=https%253A%252F%252Fimg95.699pic.com%252Fxsj%252F0i%252Fmj%252F62.jpg%2521%252Ffw%252F700%252Fwatermark%252Furl%252FL3hzai93YXRlcl9kZXRhaWwyLnBuZw%252Falign%252Fsoutheast&os=738907561%2C2489735243&pd=image_content&pi=0&pn=23&rn=1&simid=526229871%2C3795182069&tn=baiduimagedetail&width=0&word=%E7%93%B6%E5%AD%90&z=")
        );
        aiCodeHelper.chatUser(userMessage);
    }

}