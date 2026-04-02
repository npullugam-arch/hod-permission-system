package com.college.hod.controller;

import com.college.hod.entity.Hod;
import com.college.hod.entity.Request;
import com.college.hod.service.HodService;
import com.college.hod.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hod")
@CrossOrigin("*")
public class HodController {

    @Autowired
    private HodService hodService;

    @Autowired
    private RequestService requestService;

    @GetMapping("/{id}")
    public Hod getHod(@PathVariable Long id) {
        return hodService.getHodById(id);
    }

    // Get all requests under this HOD
    @GetMapping("/{hodId}/requests")
    public List<Request> getRequests(@PathVariable Long hodId) {
        return requestService.getRequestsByHod(hodId);
    }

    // Get pending requests
    @GetMapping("/{hodId}/pending")
    public List<Request> getPending(@PathVariable Long hodId) {
        return requestService.getPendingRequests(hodId);
    }
}