'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  fitnessGoals: string[];
  fitnessLevel: string;
  medicalConditions: string;
  dietaryRestrictions: string;
  workoutPreferences: string;
  equipmentAccess: string[];
  availableTime: number;
}

export default function Chat() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const customSession = session as CustomSession;
      if (customSession?.user?.id) {
        try {
          const response = await fetch('/api/user-profile');
          if (response.status === 404) {
            // No profile found, redirect to onboarding
            router.push('/onboarding');
            return;
          }
          if (response.ok) {
            const profile = await response.json();
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [session?.user?.id, router]);

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    if (session?.user) {
      console.log('User:', session.user);
      console.log('User ID:', (session as CustomSession).user.id);
    }
  }, [session, status]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome to FitMate</h2>
        <p className="text-gray-600 text-center max-w-md">
          Sign in to start your personalized fitness journey with AI-powered guidance
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="flex items-center px-8 py-4 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
        >
          <img src="/google.svg" alt="Google" className="w-6 h-6 mr-3" />
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Setting up your profile...</h2>
          <p className="text-gray-600">Please wait while we prepare your personalized experience.</p>
        </div>
      </div>
    );
  }

  const sendMessage = async (messageText: string) => {
    console.log('Attempting to send message:', messageText);
    console.log('Current session:', session);
    console.log('Loading state:', isLoading);

    if (!messageText.trim()) {
      console.log('Message is empty, not sending');
      return;
    }

    const customSession = session as CustomSession;
    if (!customSession?.user?.id) {
      console.log('No user ID found in session');
      console.log('Full session object:', customSession);
      signIn('google', { callbackUrl: '/' });
      return;
    }

    if (isLoading) {
      console.log('Already processing a message');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Setting loading state to true');
      setInput('');

      const newUserMessage = {
        content: messageText.trim(),
        role: 'user' as const,
        createdAt: new Date().toISOString()
      };
      console.log('Adding user message to state:', newUserMessage);
      setMessages(prev => [...prev, newUserMessage]);

      // Get the last 5 messages for context
      const recentMessages = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Sending API request with user ID:', customSession.user.id);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText.trim(),
          userId: customSession.user.id,
          previousMessages: recentMessages,
          userProfile
        }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      if (!data.assistantMessage?.content) {
        throw new Error('Invalid response format from server');
      }

      console.log('Adding assistant response to messages');
      setMessages(prev => [...prev, {
        content: data.assistantMessage.content,
        role: 'assistant',
        createdAt: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages(prev => [...prev, {
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        role: 'assistant',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      console.log('Setting loading state to false');
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Current input:', input);
    await sendMessage(input);
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('Enter key pressed, preventing default');
      e.preventDefault();
      await sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💪</span>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800">
                Hi {userProfile.name}! Ready to continue your fitness journey?
              </p>
              <p className="text-gray-600 mt-2">Ask me anything about:</p>
              <div className="mt-4 grid grid-cols-2 gap-3 max-w-md mx-auto">
                {[
                  '🎯 Workout Plans',
                  '📝 Exercise Form',
                  '🥗 Nutrition Tips',
                  '🔄 Recovery Advice'
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={async () => {
                      const text = item.split(' ').slice(1).join(' ');
                      setInput(text);
                      await sendMessage(text);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              } shadow-sm`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-100 p-4 bg-white"
      >
        <div className="flex items-center space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about workouts, nutrition, or fitness tips..."
            className="flex-1 rounded-xl border-2 border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-0 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 ${
              isLoading || !input.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin mr-2"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}