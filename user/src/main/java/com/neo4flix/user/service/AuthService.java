package com.neo4flix.user.service;

import com.neo4flix.user.dto.AuthResult;
import com.neo4flix.user.dto.LoginRequest;
import com.neo4flix.user.dto.RegisterRequest;
import com.neo4flix.user.dto.MfaVerifyRequest;

public interface AuthService {

    AuthResult register(RegisterRequest request);

    AuthResult login(LoginRequest request);

    AuthResult verifyMfa(MfaVerifyRequest request);
}