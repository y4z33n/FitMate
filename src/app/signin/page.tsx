'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide mb-2">Welcome to FitMate</h1>
          <p className="text-muted-foreground">Your Personal AI Fitness Assistant</p>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Sign in to continue</h2>
            <p className="text-muted-foreground text-sm">
              Get personalized workout plans and nutrition advice
            </p>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <Image
              src="/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
} 