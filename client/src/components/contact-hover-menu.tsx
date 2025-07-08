import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  Star,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Building,
  MapPin,
  Clock,
  Target,
  Activity,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Globe,
  CheckCircle,
  Users,
  Heart,
  Smile,
  ThumbsUp,
  Zap,
  Fire,
  Trophy,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactHoverMenuProps {
  contact: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
    source: string;
    lastContactDate: string;
    createdAt: string;
  };
  recommendation?: {
    score: number;
    category: string;
    metadata: {
      relationshipStrength: number;
      responseRate: number;
      preferredContactMethod: string;
      bestContactTime: string;
    };
  };
  insights?: {
    totalLoans: number;
    totalLoanValue: number;
    conversionRate: number;
    activityScore: number;
    opportunityScore: number;
  };
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  onAction?: (action: string, contactId: number) => void;
  className?: string;
}

const emojis = ['😊', '🎯', '💼', '🚀', '⭐', '🔥', '💎', '🎉', '👍', '❤️', '🌟', '💡', '🎊', '🏆'];

export default function ContactHoverMenu({ 
  contact, 
  recommendation, 
  insights, 
  socialProfiles,
  onAction,
  className 
}: ContactHoverMenuProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Add animation delay
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickAction = (action: string) => {
    if (onAction) {
      onAction(action, contact.id);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    // You can implement emoji tagging logic here
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-600" />;
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-400" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-700" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'website': return <Globe className="h-4 w-4 text-gray-600" />;
      default: return <Globe className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className={cn(
      "w-80 shadow-lg border-0 bg-white/95 backdrop-blur-sm transition-all duration-300 transform",
      isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              {selectedEmoji && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm">{selectedEmoji}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {contact.firstName} {contact.lastName}
              </h3>
              <p className="text-sm text-gray-600 leading-tight">
                {contact.jobTitle}
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                {contact.company}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {recommendation && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{recommendation.score.toFixed(0)}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-1">
              {emojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200 transition-colors"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 truncate flex-1">{contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{contact.phone}</span>
          </div>
          {recommendation && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Best time: {recommendation.metadata.bestContactTime}</span>
            </div>
          )}
        </div>

        {/* Social Profiles */}
        {socialProfiles && Object.keys(socialProfiles).length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex gap-2 mb-3">
              {Object.entries(socialProfiles).map(([platform, url]) => (
                url && (
                  <Button
                    key={platform}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                    onClick={() => window.open(url, '_blank')}
                  >
                    {getSocialIcon(platform)}
                  </Button>
                )
              ))}
            </div>
          </>
        )}

        {/* Quick Stats */}
        {insights && (
          <>
            <Separator className="my-3" />
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{insights.totalLoans}</div>
                <div className="text-xs text-gray-600">Loans</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">
                  {(insights.conversionRate * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-600">Conversion</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">
                  ${(insights.totalLoanValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-600">Volume</div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            onClick={() => handleQuickAction('call')}
          >
            <Phone className="h-4 w-4 mr-1" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 hover:bg-gray-50 transition-colors"
            onClick={() => handleQuickAction('email')}
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 hover:bg-gray-50 transition-colors"
            onClick={() => handleQuickAction('meeting')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Meet
          </Button>
        </div>

        {/* Personalized Recommendations */}
        {recommendation && (
          <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI Recommendation</span>
            </div>
            <p className="text-xs text-blue-700">
              {recommendation.metadata.preferredContactMethod === 'phone' ? 
                'This contact prefers phone calls' : 
                'This contact prefers email communication'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}