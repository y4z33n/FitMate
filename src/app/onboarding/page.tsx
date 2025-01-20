import OnboardingForm from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white tracking-wide mb-2">Welcome to FitMate</h1>
            <p className="text-gray-400">Let&apos;s get to know you better</p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
} 