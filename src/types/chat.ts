export interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  createdAt: string;
  messages: Message[];
} 