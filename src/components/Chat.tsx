'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
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

interface ChatSession {
  id: string;
  createdAt: string;
  messages: Message[];
}

const AI_MODELS = [
  { id: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Flash Thinking' },
  { id: 'google/gemini-exp-1206:free', name: 'Gemini 1.0' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash' },
  { id: 'google/learnlm-1.5-pro-experimental:free', name: 'LearnLM 1.5 Pro' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini' },
  { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B' }
];

export default function Chat() {
  const router = useRouter();
  const { data: session } = useSession() as { data: CustomSession | null };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user-profile');
          if (response.status === 404) {
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
    // Load messages from localStorage when component mounts
    const savedMessages = localStorage.getItem('chatMessages');
    const savedTimestamp = localStorage.getItem('chatTimestamp');
    
    if (savedMessages && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp);
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      // Only load messages if they're less than 24 hours old
      if (now - timestamp < oneDayInMs) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Clear old messages
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('chatTimestamp');
      }
    }
  }, []);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
      localStorage.setItem('chatTimestamp', Date.now().toString());
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('chatTimestamp');
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    
    if (!session?.user?.id) {
      signIn('google', { callbackUrl: '/' });
      return;
    }

    try {
      setIsLoading(true);
      setInput('');

      const newUserMessage = {
        content: messageText.trim(),
        role: 'user' as const,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newUserMessage]);

      const recentMessages = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText.trim(),
          userId: session.user.id,
          previousMessages: recentMessages,
          userProfile,
          model: selectedModel.id,
          hideThinking: true
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.assistantMessage?.content) {
        throw new Error('Invalid response format from server');
      }

      setMessages(prev => [...prev, {
        content: data.assistantMessage.content,
        role: 'assistant',
        createdAt: new Date().toISOString()
      }]);

    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, {
        content: `High demand at the moment. Please try again in a few seconds.`,
        role: 'assistant',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await sendMessage(input);
    }
  };

  const retryMessage = async (messageIndex: number) => {
    if (!messages[messageIndex]) return;
    const messageToRetry = messages[messageIndex];
    setMessages(prev => prev.slice(0, messageIndex));
    await sendMessage(messageToRetry.content);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="sticky top-0 w-full bg-background/95 backdrop-blur-sm border-b z-50">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="relative"
              >
                <span className="text-sm font-medium">{selectedModel.name}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>

              {isModelMenuOpen && (
                <Card className="absolute left-0 mt-2 w-64 top-full">
                  <CardContent className="p-2">
                    {AI_MODELS.map((model) => (
                      <Button
                        key={model.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          model.id === selectedModel.id && "bg-accent"
                        )}
                        onClick={() => {
                          setSelectedModel(model);
                          setIsModelMenuOpen(false);
                        }}
                      >
                        {model.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signIn('google', { callbackUrl: '/signin' })}
                className="text-destructive"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="text-center space-y-2">
                  <h1 className="text-4xl font-bold tracking-wide">FITMATE</h1>
                  <p className="text-muted-foreground">Your Personal Fitness Companion</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    { icon: '🎯', text: 'Training Program', desc: 'Get a personalized workout plan' },
                    { icon: '📊', text: 'Progress Tracking', desc: 'Monitor your fitness journey' },
                    { icon: '🥗', text: 'Nutrition Guide', desc: 'Optimize your diet' },
                    { icon: '⚡', text: 'Quick Workouts', desc: 'Efficient exercise routines' }
                  ].map((item, index) => (
                    <Card
                      key={`suggestion-${index}`}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setInput(item.text);
                        sendMessage(item.text);
                      }}
                    >
                      <CardHeader>
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <CardTitle className="text-base">{item.text}</CardTitle>
                        <CardDescription>{item.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`message-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={cn(
                      "max-w-[85%] md:max-w-[75%]",
                      message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.content.includes('High demand') && (
                        <Button
                          variant="ghost"
                          onClick={() => retryMessage(index - 1)}
                          className="mt-2 text-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Retry message
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="sticky bottom-0 bg-background border-t">
          <div className="max-w-2xl mx-auto p-4 flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-destructive"
              title="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
            <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about workouts, nutrition, or fitness tips..."
                className="flex-1 bg-muted text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-current rounded-full border-t-transparent animate-spin"></div>
                    <span>Sending</span>
                  </div>
                ) : (
                  <span>Send</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
