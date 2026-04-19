package com.componse.aicodehelper.user.controller;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/user")
public class UserController {

    @RequestMapping("/test")
    public String testUser(){
        return "register";
    }
}
