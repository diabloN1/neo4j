package com.neo4flix.user.repository;

import com.neo4flix.common.entity.User;

import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;

public interface UserRepository extends Neo4jRepository<User, Long> {
    Optional<User> findByEmail(String email);
}