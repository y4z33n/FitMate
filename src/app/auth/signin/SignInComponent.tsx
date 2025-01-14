'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

interface Providers {
  [key: string]: Provider;
}

export default function SignInComponent({ providers }: { providers: Providers | null }) {
  if (!providers) return null;

  return (
    <div className="flex flex-col space-y-4">
      {Object.values(providers).map((provider) => (
        <button
          key={provider.id}
          onClick={() => signIn(provider.id, { callbackUrl: '/' })}
          className="flex items-center justify-center space-x-2 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {provider.id === 'google' && (
            <Image
              src="/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          )}
          <span>Sign in with {provider.name}</span>
        </button>
      ))}
    </div>
  );
} 