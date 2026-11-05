package com.neo4flix.user.service;

import com.neo4flix.user.dto.ChangePasswordRequest;
import com.neo4flix.user.dto.DeleteAccountRequest;
import com.neo4flix.user.dto.MfaStatusResponse;
import com.neo4flix.user.dto.ProfileUpdateResponse;
import com.neo4flix.user.dto.TotpConfirmRequest;
import com.neo4flix.user.dto.TotpDisableRequest;
import com.neo4flix.user.dto.TotpSetupResponse;
import com.neo4flix.user.dto.UpdateProfileRequest;
import com.neo4flix.user.dto.UserResponse;

public interface UserService {
    UserResponse getProfile(Long userId, String authorization);

    ProfileUpdateResponse updateProfile(Long userId, UpdateProfileRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    void deleteAccount(Long userId, DeleteAccountRequest request);

    TotpSetupResponse setupTotp(Long userId);

    void confirmTotp(Long userId, TotpConfirmRequest request);

    MfaStatusResponse getMfaStatus(Long userId);

    void disableTotp(Long userId, TotpDisableRequest request);
}