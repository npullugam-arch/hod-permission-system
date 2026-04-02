package com.college.hod.controller;

import com.college.hod.entity.User;
import com.college.hod.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = authService.login(request.getUsername(), request.getPassword());

        if (user == null) {
            return ResponseEntity
                    .badRequest()
                    .body("Invalid username or password");
        }

        // return user + role so frontend can redirect (STUDENT / HOD)
        return ResponseEntity.ok(user);
    }
}