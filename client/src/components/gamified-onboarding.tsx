import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy,
  Star,
  Target,
  CheckCircle,
  Clock,
  Zap,
  Award,
  Gift,
  Users,
  FileText,
  Calculator,
  Phone,
  Mail,
  Building,
  TrendingUp,
  Brain,
  Rocket,
  Crown,
  Medal,
  Sparkles,
  Fire,
  Heart,
  Diamond,
  Gem
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  points: number;
  category: 'setup' | 'first_actions' | 'advanced' | 'mastery';
  completed: boolean;
  action?: () => void;
  route?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
}

interface GamifiedOnboardingProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'profile_setup',
    title: 'Complete Your Profile',
    description: 'Add your personal information and preferences',
    icon: Users,
    points: 50,
    category: 'setup',
    completed: false,
    route: '/profile'
  },
  {
    id: 'first_contact',
    title: 'Add Your First Contact',
    description: 'Import or manually add your first contact',
    icon: Users,
    points: 100,
    category: 'first_actions',
    completed: false,
    route: '/contacts'
  },
  {
    id: 'first_application',
    title: 'Create Your First Application',
    description: 'Start your first loan application',
    icon: FileText,
    points: 150,
    category: 'first_actions',
    completed: false,
    route: '/new-application'
  },
  {
    id: 'use_calculator',
    title: 'Try the Mortgage Calculator',
    description: 'Calculate loan payments and terms',
    icon: Calculator,
    points: 75,
    category: 'first_actions',
    completed: false,
    route: '/mortgage-calculator'
  },
  {
    id: 'ai_recommendation',
    title: 'Get AI Loan Recommendation',
    description: 'Use AI to get personalized loan recommendations',
    icon: Brain,
    points: 200,
    category: 'advanced',
    completed: false,
    route: '/loan-recommendation'
  },
  {
    id: 'contact_recommendations',
    title: 'Explore Contact Recommendations',
    description: 'Discover intelligent contact suggestions',
    icon: Target,
    points: 125,
    category: 'advanced',
    completed: false,
    route: '/contact-recommendations'
  },
  {
    id: 'market_analysis',
    title: 'Analyze Market Trends',
    description: 'View market insights and trends',
    icon: TrendingUp,
    points: 100,
    category: 'advanced',
    completed: false,
    route: '/market-trends'
  },
  {
    id: 'workflow_automation',
    title: 'Set Up Workflow Automation',
    description: 'Configure automated processes',
    icon: Zap,
    points: 300,
    category: 'mastery',
    completed: false,
    route: '/workflow-automation'
  }
];

const achievements: Achievement[] = [
  {
    id: 'quick_start',
    title: 'Quick Start Champion',
    description: 'Complete 3 onboarding steps in under 10 minutes',
    icon: Rocket,
    points: 150,
    rarity: 'common',
    unlocked: false
  },
  {
    id: 'first_hundred',
    title: 'Century Club',
    description: 'Earn your first 100 points',
    icon: Trophy,
    points: 50,
    rarity: 'common',
    unlocked: false
  },
  {
    id: 'ai_master',
    title: 'AI Whisperer',
    description: 'Use all AI-powered features',
    icon: Brain,
    points: 250,
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'contact_guru',
    title: 'Contact Guru',
    description: 'Add 10+ contacts and use recommendations',
    icon: Users,
    points: 200,
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete all onboarding steps',
    icon: Crown,
    points: 500,
    rarity: 'epic',
    unlocked: false
  },
  {
    id: 'legend',
    title: 'LoanDaddy Legend',
    description: 'Reach 1000+ points total',
    icon: Diamond,
    points: 1000,
    rarity: 'legendary',
    unlocked: false
  }
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'setup': return 'bg-blue-50 border-blue-200';
    case 'first_actions': return 'bg-green-50 border-green-200';
    case 'advanced': return 'bg-purple-50 border-purple-200';
    case 'mastery': return 'bg-orange-50 border-orange-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

export default function GamifiedOnboarding({ isVisible, onClose, onNavigate }: GamifiedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [steps, setSteps] = useState(onboardingSteps);
  const [userAchievements, setUserAchievements] = useState(achievements);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('onboarding_progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setSteps(parsed.steps || onboardingSteps);
      setUserAchievements(parsed.achievements || achievements);
      setTotalPoints(parsed.totalPoints || 0);
    }
  }, []);

  useEffect(() => {
    // Save progress to localStorage
    const progress = {
      steps,
      achievements: userAchievements,
      totalPoints
    };
    localStorage.setItem('onboarding_progress', JSON.stringify(progress));
  }, [steps, userAchievements, totalPoints]);

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    const step = steps.find(s => s.id === stepId);
    if (step && !step.completed) {
      setTotalPoints(prev => prev + step.points);
      checkAchievements(stepId, totalPoints + step.points);
    }
  };

  const checkAchievements = (completedStepId: string, newTotalPoints: number) => {
    const completedCount = steps.filter(s => s.completed).length + 1;
    
    // Check for achievements
    const newUnlocked = userAchievements.filter(achievement => {
      if (achievement.unlocked) return false;
      
      switch (achievement.id) {
        case 'first_hundred':
          return newTotalPoints >= 100;
        case 'quick_start':
          return completedCount >= 3;
        case 'ai_master':
          return completedStepId === 'ai_recommendation';
        case 'contact_guru':
          return completedStepId === 'contact_recommendations';
        case 'perfectionist':
          return completedCount >= totalSteps;
        case 'legend':
          return newTotalPoints >= 1000;
        default:
          return false;
      }
    });

    if (newUnlocked.length > 0) {
      setUserAchievements(prev => prev.map(achievement => 
        newUnlocked.some(nu => nu.id === achievement.id) 
          ? { ...achievement, unlocked: true, unlockedAt: new Date() }
          : achievement
      ));
      
      // Show achievement notification
      setNewAchievement(newUnlocked[0]);
      setTimeout(() => setNewAchievement(null), 3000);
    }
  };

  const handleStepClick = (step: OnboardingStep) => {
    if (step.route) {
      onNavigate(step.route);
      completeStep(step.id);
    }
  };

  const getLevel = (points: number) => {
    if (points >= 1000) return { level: 'Legend', icon: Crown, color: 'text-yellow-600' };
    if (points >= 500) return { level: 'Expert', icon: Diamond, color: 'text-purple-600' };
    if (points >= 250) return { level: 'Advanced', icon: Medal, color: 'text-blue-600' };
    if (points >= 100) return { level: 'Intermediate', icon: Star, color: 'text-green-600' };
    return { level: 'Beginner', icon: Sparkles, color: 'text-gray-600' };
  };

  const currentLevel = getLevel(totalPoints);
  const nextLevel = getLevel(totalPoints + 100);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Welcome to LoanDaddy Enterprise
              </CardTitle>
              <p className="text-blue-100 mt-2">Complete your onboarding journey and unlock powerful features</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <currentLevel.icon className={cn("h-5 w-5", currentLevel.color)} />
                <span className="font-semibold">{currentLevel.level}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-100">
                <Star className="h-4 w-4" />
                <span>{totalPoints} points</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Progress Overview */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{completedSteps} of {totalSteps} completed</span>
            </div>
            <Progress value={progress} className="mb-4" />
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowAchievements(!showAchievements)}
                className="flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Achievements ({userAchievements.filter(a => a.unlocked).length})
              </Button>
              <Button onClick={onClose} variant="ghost">
                Skip for now
              </Button>
            </div>
          </div>

          {/* Achievements Panel */}
          {showAchievements && (
            <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        achievement.unlocked 
                          ? getRarityColor(achievement.rarity) 
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      )}
                    >
                      <achievement.icon className="h-6 w-6" />
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm opacity-80">{achievement.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3" />
                          <span className="text-xs">{achievement.points} points</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onboarding Steps */}
          <div className="space-y-4">
            {['setup', 'first_actions', 'advanced', 'mastery'].map((category) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 capitalize">
                  {category.replace('_', ' ')} 
                  {category === 'setup' && ' 🏗️'}
                  {category === 'first_actions' && ' 🚀'}
                  {category === 'advanced' && ' 🎯'}
                  {category === 'mastery' && ' 👑'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {steps.filter(step => step.category === category).map((step) => (
                    <Card
                      key={step.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-2",
                        step.completed 
                          ? "bg-green-50 border-green-200" 
                          : getCategoryColor(category)
                      )}
                      onClick={() => handleStepClick(step)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            step.completed ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                          )}>
                            {step.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <step.icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{step.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                {step.points} points
                              </Badge>
                              {step.completed && (
                                <Badge className="bg-green-600 text-white text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Notification */}
      {newAchievement && (
        <div className="fixed top-4 right-4 z-60 animate-in slide-in-from-right">
          <Card className="w-80 bg-gradient-to-r from-yellow-400 to-orange-400 border-yellow-300 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <newAchievement.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Achievement Unlocked!</h3>
                  <p className="text-sm opacity-90">{newAchievement.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3" />
                    <span className="text-xs">+{newAchievement.points} points</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export { GamifiedOnboarding };