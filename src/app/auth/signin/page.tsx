import { getProviders } from 'next-auth/react';
import SignInComponent from './SignInComponent';

export default async function SignIn() {
  const providers = await getProviders();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Welcome to FitMate</h1>
          <p className="text-gray-600 mt-2">Sign in to start your fitness journey</p>
        </div>
        <SignInComponent providers={providers} />
      </div>
    </div>
  );
} 