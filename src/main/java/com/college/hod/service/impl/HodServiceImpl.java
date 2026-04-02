package com.college.hod.service.impl;

import com.college.hod.entity.Hod;
import com.college.hod.repository.HodRepository;
import com.college.hod.service.HodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class HodServiceImpl implements HodService {

    @Autowired
    private HodRepository hodRepository;

    @Override
    public Hod getHodById(Long id) {
        return hodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HOD not found"));
    }
}