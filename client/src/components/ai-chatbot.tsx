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
  Loader2
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

interface AIChatbotProps {
  contactId?: number;
  onActionSuggested?: (action: any) => void;
  initialMessage?: string;
}

export default function AIChatbot({ contactId, onActionSuggested, initialMessage }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId] = useState(`chat_${Date.now()}_${contactId || 'guest'}`);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, initialMessage, messages.length]);

  const handleSendMessage = () => {
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    // Send to AI
    sendMessageMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'schedule_call': return <Phone className="w-4 h-4" />;
      case 'send_email': return <Mail className="w-4 h-4" />;
      case 'create_task': return <Calendar className="w-4 h-4" />;
      case 'escalate': return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white border border-gray-200 rounded-lg shadow-xl">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-blue-600" />
                LoanFlow AI Assistant
              </CardTitle>
              <CardDescription>
                Ask me about loans, rates, and the application process
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">
                    Hi! I'm your AI loan assistant. Ask me about:
                  </p>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• DSCR and Fix-and-Flip loans</li>
                    <li>• Interest rates and terms</li>
                    <li>• Application process</li>
                    <li>• Document requirements</li>
                  </ul>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {sendMessageMutation.isPending && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about loans..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6"
                onClick={() => setCurrentMessage("What are current DSCR loan rates?")}
              >
                DSCR Rates
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6"
                onClick={() => setCurrentMessage("What documents do I need for a loan application?")}
              >
                Documents
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-6"
                onClick={() => setCurrentMessage("How long does the approval process take?")}
              >
                Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}