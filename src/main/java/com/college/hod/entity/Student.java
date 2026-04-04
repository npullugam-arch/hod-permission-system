package com.college.hod.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String section;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne
    @JoinColumn(name = "hod_id")
    @JsonIgnoreProperties({"user"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Hod hod;
}
