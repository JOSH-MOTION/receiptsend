import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '@/lib/models';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log('✅ MongoDB already connected');
    return;
  }
  
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ MongoDB connected successfully');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Authorization attempt for:', credentials?.email);

        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            console.error('❌ Missing credentials');
            throw new Error('Please enter an email and password');
          }

          // Ensure DB connection
          await connectDB();
          console.log('✅ Database connected');

          // Find user
          const user = await User.findOne({ email: credentials.email }).lean();
          console.log('👤 User lookup result:', user ? 'Found' : 'Not found');

          if (!user) {
            console.error('❌ No user found with email:', credentials.email);
            throw new Error('No account found with this email. Please sign up first.');
          }

          // Verify password
          console.log('🔑 Comparing passwords...');
          const isPasswordValid = await compare(credentials.password, user.password);
          console.log('🔑 Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.error('❌ Invalid password for:', credentials.email);
            throw new Error('Incorrect password. Please try again.');
          }

          console.log('✅ Authentication successful for:', credentials.email);

          // Return user object
          return {
            id: user._id.toString(),
            email: user.email,
            organizationId: user.organizationId,
          };
        } catch (error: any) {
          console.error('❌ Authorization error:', error.message);
          throw error; // Re-throw to show to user
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login on error
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        console.log('✅ JWT token created for:', token.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
        console.log('✅ Session created for:', session.user.email);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };