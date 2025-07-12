import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Loader2, X, Minimize2, Maximize2,
  FileText, DollarSign, Home, HelpCircle, Clock
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestedActions?: Array<{
    type: string;
    description: string;
    data?: any;
  }>;
}

interface AIChatWidgetProps {
  borrowerId: number;
  loanApplicationId?: number;
  onActionClick?: (action: any) => void;
}

export default function AIChatWidget({ 
  borrowerId, 
  loanApplicationId,
  onActionClick 
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string>(`chat-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('borrowerToken')}`
        },
        body: JSON.stringify({
          sessionId,
          message,
          contactId: borrowerId,
          loanApplicationId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        confidence: data.confidence,
        suggestedActions: data.suggestedActions
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  });
  
  const handleSendMessage = () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;
    
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    sendMessageMutation.mutate(inputValue);
  };
  
  const handleActionClick = (action: any) => {
    if (onActionClick) {
      onActionClick(action);
    }
    
    // Add action feedback to chat
    const actionMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Action: ${action.description}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, actionMessage]);
  };
  
  // Quick action buttons
  const quickActions = [
    { icon: DollarSign, label: 'Loan Status', query: 'What is the status of my loan application?' },
    { icon: FileText, label: 'Documents', query: 'What documents do I need to submit?' },
    { icon: Home, label: 'Property', query: 'Tell me about property requirements' },
    { icon: HelpCircle, label: 'Help', query: 'How can you help me?' }
  ];
  
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
    >
      <Card className="shadow-2xl border-0">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">LoanGenius AI Assistant</h3>
                <p className="text-xs opacity-90">Always here to help</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="h-96 p-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Hi! I'm your AI loan assistant. How can I help you today?
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start"
                        onClick={() => {
                          setInputValue(action.query);
                          handleSendMessage();
                        }}
                      >
                        <action.icon className="h-4 w-4 mr-2" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`flex items-start space-x-2 max-w-[80%] ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className={`rounded-lg p-3 ${
                              message.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : message.role === 'system'
                                ? 'bg-muted'
                                : 'bg-gray-100'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              
                              {message.confidence && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Confidence: {Math.round(message.confidence * 100)}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                            
                            {message.suggestedActions && message.suggestedActions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.suggestedActions.map((action, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs w-full justify-start"
                                    onClick={() => handleActionClick(action)}
                                  >
                                    {action.description}
                                  </Button>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {sendMessageMutation.isPending && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }} className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by LoanGenius AI • Available 24/7
              </p>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}