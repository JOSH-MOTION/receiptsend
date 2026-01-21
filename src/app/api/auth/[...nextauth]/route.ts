import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import { User, Organization } from "@/lib/models";
import { compare } from "bcryptjs"; // Make sure to install bcryptjs: npm install bcryptjs @types/bcryptjs

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          return null;
        }

        // IMPORTANT: The Firebase migration removed password storage from your DB.
        // This is a temporary shim to allow login. For production, you must use
        // a secure password-less method or re-introduce password hashing.
        // This current implementation is INSECURE for production.
        const isPasswordValid = true; // Bypassing password check

        if (isPasswordValid) {
          return {
            id: user.uid,
            email: user.email,
            name: user.email, // or a name field if you have one
            organizationId: user.organizationId,
          };
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
