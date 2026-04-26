package com.wd32._5.smart_campus.repository;

import com.wd32._5.smart_campus.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findBySliitId(String sliitId);
}