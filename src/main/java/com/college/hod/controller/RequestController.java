package com.college.hod.controller;

import com.college.hod.entity.Request;
import com.college.hod.entity.User;
import com.college.hod.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/request")
@CrossOrigin(origins = "*")
public class RequestController {

    @Autowired
    private RequestService requestService;

    @PostMapping("/create")
    public Request createRequest(@RequestBody Request request) {
        return requestService.createRequest(request);
    }

    @PutMapping("/approve/{id}")
    public Request approveRequest(@PathVariable Long id) {
        return requestService.approveRequest(id);
    }

    @PutMapping("/reject/{id}")
    public Request rejectRequest(@PathVariable Long id) {
        return requestService.rejectRequest(id);
    }

    @GetMapping("/student/{studentId}")
    public List<Request> getRequestsByStudent(@PathVariable Long studentId) {
        return requestService.getRequestsByStudent(studentId);
    }

    @GetMapping("/hod/{hodId}")
    public List<Request> getRequestsByHod(@PathVariable Long hodId) {
        return requestService.getRequestsByHod(hodId);
    }

    @GetMapping("/hod/{hodId}/pending")
    public List<Request> getPendingRequests(@PathVariable Long hodId) {
        return requestService.getPendingRequests(hodId);
    }

    @GetMapping("/hods")
    public List<User> getAllHods() {
        return requestService.getAllHods();
    }
}