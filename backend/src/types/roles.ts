export type UserRole = "patient" | "doctor" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

