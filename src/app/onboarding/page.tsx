import OnboardingForm from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
              Welcome to FitMate
            </h1>
            <p className="text-gray-600 mt-2">
              Let's personalize your fitness journey
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
} 