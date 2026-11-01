export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
}

export interface ProfileUpdateResponse {
  accessToken: string;
  user: UserProfile;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}
