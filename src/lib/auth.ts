import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client
import jwt from "jsonwebtoken"; // Need this for Supabase adapter

// Ensure JWT_SECRET is set for Supabase adapter
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables for NextAuth Supabase adapter");
}

export const authOptions: NextAuthOptions = {
  // Use the Supabase adapter
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role Key for adapter operations
  }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Use Supabase Auth to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          console.error("Supabase Sign In Error:", error?.message);
          // Throw an error or return null/false to indicate failure
          // Returning null is standard for authorize function on failure
          return null;
        }

        // If sign-in is successful, Supabase returns user data
        // The adapter will handle linking this session to the database user record
        // We just need to return the user object expected by NextAuth
        return {
          id: data.user.id,
          email: data.user.email,
          // Add other user properties if needed, though adapter handles DB sync
        };
      },
    }),
    // Add other providers like Google, GitHub etc. later if needed
  ],
  session: {
    strategy: "jwt", // Use JWT strategy with Supabase adapter
  },
  jwt: {
    // Use the JWT_SECRET for signing
    secret: process.env.JWT_SECRET,
    // Encode and decode functions needed for Supabase adapter
    encode: async ({ secret, token }) => {
      const encodedToken = jwt.sign(token!, secret, { algorithm: "HS256" });
      return encodedToken;
    },
    decode: async ({ secret, token }) => {
      const decodedToken = jwt.verify(token!, secret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
      return decodedToken;
    },
  },
  callbacks: {
    // Modify session callback to include user ID from JWT token
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub; // Add user ID to session
      }
      return session;
    },
    // JWT callback persists user ID in the token
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    // Add other custom pages if needed (e.g., error, verifyRequest)
  },
  // Enable debug messages in development
  debug: process.env.NODE_ENV === "development",
};

// Note: Registration is now handled directly via Supabase client functions,
// not through a separate NextAuth provider or API route.

