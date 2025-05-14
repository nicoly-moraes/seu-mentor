declare module '@/services/authService' {
  export const registerUser: (userData: Record<string, any>) => Promise<any>;
  export const loginUser: (credentials: Record<string, any>) => Promise<any>;
  export const forgotPassword: (emailData: Record<string, any>) => Promise<any>;
  export const resetPassword: (resetData: Record<string, any>) => Promise<any>;
  export const logoutUser: () => void;
}
