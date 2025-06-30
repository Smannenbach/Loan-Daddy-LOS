import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIResponse {
  message: string;
  confidence: number;
  suggestedActions: Array<{
    type: 'schedule_call' | 'send_email' | 'create_task' | 'escalate';
    description: string;
    data?: any;
  }>;
  nextSteps: string[];
}

interface AIChatbotWidgetProps {
  contactId?: number;
  onActionSuggested?: (action: any) => void;
  initialMessage?: string;
}

export default function AIChatbotWidget({ contactId, onActionSuggested, initialMessage }: AIChatbotWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId] = useState(`chat_${Date.now()}_${contactId || 'guest'}`);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Add initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [initialMessage, messages.length]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => apiRequest('POST', '/api/ai/chat', {
      sessionId,
      message,
      contactId
    }),
    onSuccess: (response: AIResponse) => {
      // Add AI response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }]);

      // Handle suggested actions
      if (response.suggestedActions.length > 0 && onActionSuggested) {
        response.suggestedActions.forEach(action => {
          onActionSuggested(action);
        });
      }
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      }]);
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(currentMessage);
    setCurrentMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          AI Assistant
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
    }`}>
      <Card className="h-full flex flex-col border-0">
        <CardHeader className="flex-shrink-0 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-5 h-5 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <CardTitle className="text-lg">LoanFlow AI</CardTitle>
                {!isMinimized && (
                  <CardDescription className="text-sm">
                    Ask me about loans, rates, and applications
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900 border'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 border">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-blue-600" />
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Ask me anything about loans..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                    className="px-3"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {messages.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Powered by AI • Session: {sessionId.split('_')[2]}
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}