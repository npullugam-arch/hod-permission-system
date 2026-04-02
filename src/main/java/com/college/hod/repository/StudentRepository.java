package com.college.hod.repository;

import com.college.hod.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByHodId(Long hodId);
}