package com.college.hod.service.impl;

import com.college.hod.entity.Request;
import com.college.hod.entity.User;
import com.college.hod.enums.RequestStatus;
import com.college.hod.enums.Role;
import com.college.hod.repository.RequestRepository;
import com.college.hod.repository.UserRepository;
import com.college.hod.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RequestServiceImpl implements RequestService {

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Request createRequest(Request request) {

        if (request.getStudent() == null || request.getStudent().getId() == null) {
            throw new RuntimeException("Student ID is required");
        }

        if (request.getHod() == null || request.getHod().getId() == null) {
            throw new RuntimeException("HOD selection is required");
        }

        User hodUser = userRepository.findById(request.getHod().getId())
                .orElseThrow(() -> new RuntimeException("Selected HOD not found"));

        if (hodUser.getRole() != Role.HOD) {
            throw new RuntimeException("Selected user is not an HOD");
        }

        request.setHod(hodUser);
        request.setStatus(RequestStatus.PENDING);
        request.setRequestDate(LocalDate.now());

        return requestRepository.save(request);
    }

    @Override
    public Request approveRequest(Long requestId) {
        Request req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        req.setStatus(RequestStatus.APPROVED);
        req.setApprovalDate(LocalDate.now());

        if (req.getEndDate() != null) {
            req.setCertificateDueDate(req.getEndDate().plusDays(3));
        }

        return requestRepository.save(req);
    }

    @Override
    public Request rejectRequest(Long requestId) {
        Request req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        req.setStatus(RequestStatus.REJECTED);
        return requestRepository.save(req);
    }

    @Override
    public List<Request> getRequestsByStudent(Long studentId) {
        return requestRepository.findByStudentId(studentId);
    }

    @Override
    public List<Request> getRequestsByHod(Long hodId) {
        return requestRepository.findByHodId(hodId);
    }

    @Override
    public List<Request> getPendingRequests(Long hodId) {
        return requestRepository.findByHodIdAndStatus(hodId, RequestStatus.PENDING);
    }

    @Override
    public List<User> getAllHods() {
        return userRepository.findByRole(Role.HOD);
    }
}