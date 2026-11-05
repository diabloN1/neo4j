import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import {
  ChangePasswordRequest,
  DeleteAccountRequest,
  MfaStatusResponse,
  ProfileUpdateResponse,
  TotpConfirmRequest,
  TotpDisableRequest,
  TotpSetupResponse,
  UpdateProfileRequest,
  UserProfile,
} from "@/models/user.model";

@Injectable({ providedIn: "root" })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = "/api/users/me";

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateProfile(
    request: UpdateProfileRequest,
  ): Observable<ProfileUpdateResponse> {
    return this.http.put<ProfileUpdateResponse>(this.apiUrl, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/password`, request);
  }

  deleteAccount(request: DeleteAccountRequest): Observable<void> {
    return this.http.delete<void>(this.apiUrl, { body: request });
  }

  getMfaStatus(): Observable<MfaStatusResponse> {
    return this.http.get<MfaStatusResponse>(`${this.apiUrl}/mfa/status`);
  }

  setupTotp(): Observable<TotpSetupResponse> {
    return this.http.post<TotpSetupResponse>(
      `${this.apiUrl}/mfa/totp/setup`,
      {},
    );
  }
  
  disableTotp(request: TotpDisableRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/mfa/totp/disable`,
      request,
    );
  }
  confirmTotp(request: TotpConfirmRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mfa/totp/confirm`, request);
  }
}
