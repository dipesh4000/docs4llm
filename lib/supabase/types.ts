export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          emailVerified: boolean;
          image: string | null;
          isAnonymous: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          emailVerified?: boolean;
          image?: string | null;
          isAnonymous?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          emailVerified?: boolean;
          image?: string | null;
          isAnonymous?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
