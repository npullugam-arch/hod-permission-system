package com.college.hod.repository;

import com.college.hod.entity.Request;
import com.college.hod.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestRepository extends JpaRepository<Request, Long> {

    List<Request> findByStudentId(Long studentId);

    List<Request> findByHodId(Long hodId);

    List<Request> findByHodIdAndStatus(Long hodId, RequestStatus status);
}