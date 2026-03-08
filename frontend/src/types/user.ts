export interface User {
  id: string;
  email: string;
  username: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
