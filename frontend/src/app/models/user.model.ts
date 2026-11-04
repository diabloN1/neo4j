import { UserRatings } from "./rating.model";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  ratings: UserRatings[];
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

export interface MfaStatusResponse {
  enabled: boolean;
}

export interface TotpSetupResponse {
  provisioningUri: string;
}

export interface TotpConfirmRequest {
  code: string;
}
