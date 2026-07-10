export type UserType = "guest" | "regular";

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  type?: UserType;
};

export type Session = {
  user: AuthUser;
};
