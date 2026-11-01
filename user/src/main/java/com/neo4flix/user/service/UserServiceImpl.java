package com.neo4flix.user.service;

import com.neo4flix.common.entity.User;
import com.neo4flix.user.dto.*;
import com.neo4flix.user.exception.BadRequestException;
import com.neo4flix.user.exception.ConflictException;
import com.neo4flix.user.exception.UnauthorizedException;
import com.neo4flix.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = getUserById(userId);
        return new UserResponse(user);
    }

    @Override
    @Transactional
    public ProfileUpdateResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);

        String newEmail = request.email().trim().toLowerCase();
        String newName = request.name().trim();

        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(user.getId())) {
                    throw new ConflictException("Email is already in use by another account");
                }
            });
            user.setEmail(newEmail);
        }

        user.setName(newName);
        User updated = userRepository.save(user);

        String newToken = jwtService.generateAccessToken(updated);

        return new ProfileUpdateResponse(newToken, new UserResponse(updated));
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as the current password");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest request) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Incorrect password. Account deletion canceled.");
        }

        userRepository.deleteUserAndOwnedDataById(userId);
    }

    private User getUserById(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("User session is not authenticated");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User account not found"));
    }
}