package com.neo4flix.user.repository;

import com.neo4flix.common.entity.User;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends Neo4jRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            MATCH (u:User) WHERE id(u) = $userId
            OPTIONAL MATCH (u)-[:OWNS]->(m:Movie)
            DETACH DELETE m
            WITH u
            DETACH DELETE u
            RETURN count(u)
            """)
    void deleteUserAndOwnedDataById(@Param("userId") Long userId);

    Optional<User> findByMfaChallengeHash(String mfaChallengeHash);
}