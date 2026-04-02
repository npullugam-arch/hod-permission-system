package com.college.hod.service;

import com.college.hod.entity.User;

public interface AuthService {
    User login(String username, String password);
}