import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import {
  Trophy, Medal, Star, Award, Target, Zap, TrendingUp,
  Users, Clock, CheckCircle, Lock, Gift, Crown, Flame,
  Rocket, Diamond, Heart, Sparkles
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'onboarding' | 'loans' | 'documents' | 'engagement' | 'mastery';
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserLevel {
  current: number;
  name: string;
  nextLevel: number;
  currentXP: number;
  requiredXP: number;
  perks: string[];
}

interface Streak {
  current: number;
  longest: number;
  lastActivity: Date;
}

interface GamificationData {
  totalPoints: number;
  level: UserLevel;
  achievements: Achievement[];
  streaks: Streak;
  leaderboardPosition: number;
  weeklyChallenge?: {
    name: string;
    description: string;
    progress: number;
    target: number;
    reward: number;
    endsAt: Date;
  };
}

const achievements: Achievement[] = [
  // Onboarding
  {
    id: 'first-login',
    name: 'Welcome Aboard',
    description: 'Complete your first login',
    icon: Rocket,
    category: 'onboarding',
    points: 50,
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'profile-complete',
    name: 'Identity Established',
    description: 'Complete your profile information',
    icon: CheckCircle,
    category: 'onboarding',
    points: 100,
    unlocked: true,
    rarity: 'common'
  },
  // Loans
  {
    id: 'first-application',
    name: 'First Steps',
    description: 'Submit your first loan application',
    icon: Target,
    category: 'loans',
    points: 200,
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'loan-approved',
    name: 'Approved!',
    description: 'Get your first loan approved',
    icon: Trophy,
    category: 'loans',
    points: 500,
    unlocked: false,
    rarity: 'rare'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete an application in under 10 minutes',
    icon: Zap,
    category: 'loans',
    points: 300,
    unlocked: false,
    rarity: 'rare'
  },
  // Documents
  {
    id: 'document-master',
    name: 'Document Master',
    description: 'Upload all required documents',
    icon: Medal,
    category: 'documents',
    points: 250,
    unlocked: true,
    rarity: 'common'
  },
  {
    id: 'ai-perfect',
    name: 'AI Perfect Score',
    description: 'Have AI recognize all documents with 95%+ confidence',
    icon: Sparkles,
    category: 'documents',
    points: 400,
    unlocked: false,
    rarity: 'epic'
  },
  // Engagement
  {
    id: 'week-streak',
    name: 'Consistent Player',
    description: 'Maintain a 7-day login streak',
    icon: Flame,
    category: 'engagement',
    points: 150,
    unlocked: false,
    progress: 5,
    maxProgress: 7,
    rarity: 'common'
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Connect with 10 contacts',
    icon: Users,
    category: 'engagement',
    points: 300,
    unlocked: false,
    progress: 7,
    maxProgress: 10,
    rarity: 'rare'
  },
  // Mastery
  {
    id: 'loan-expert',
    name: 'Loan Expert',
    description: 'Successfully complete 10 loan applications',
    icon: Crown,
    category: 'mastery',
    points: 1000,
    unlocked: false,
    progress: 3,
    maxProgress: 10,
    rarity: 'legendary'
  },
  {
    id: 'financial-wizard',
    name: 'Financial Wizard',
    description: 'Achieve a perfect financial health score',
    icon: Diamond,
    category: 'mastery',
    points: 1500,
    unlocked: false,
    rarity: 'legendary'
  }
];

const levelNames = [
  'Novice', 'Apprentice', 'Practitioner', 'Expert', 
  'Master', 'Grandmaster', 'Legend', 'Mythic'
];

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-orange-500'
};

export default function GamificationSystem() {
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationData>({
    totalPoints: 1100,
    level: {
      current: 3,
      name: 'Practitioner',
      nextLevel: 4,
      currentXP: 1100,
      requiredXP: 2000,
      perks: ['Priority support', 'Exclusive insights', 'Beta features']
    },
    achievements: achievements,
    streaks: {
      current: 5,
      longest: 12,
      lastActivity: new Date()
    },
    leaderboardPosition: 42,
    weeklyChallenge: {
      name: 'Document Sprint',
      description: 'Upload 5 documents this week',
      progress: 3,
      target: 5,
      reward: 500,
      endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    }
  });

  // Simulate achievement unlock
  const unlockAchievement = (achievementId: string) => {
    const achievement = gamificationData.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
      setShowAchievement(achievement);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Update points
      setGamificationData(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + achievement.points,
        level: {
          ...prev.level,
          currentXP: prev.level.currentXP + achievement.points
        }
      }));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onboarding': return Rocket;
      case 'loans': return Target;
      case 'documents': return Medal;
      case 'engagement': return Users;
      case 'mastery': return Crown;
      default: return Star;
    }
  };

  const getTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <>
      {/* Main Gamification Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Progress
            </span>
            <Badge variant="secondary">Level {gamificationData.level.current}</Badge>
          </CardTitle>
          <CardDescription>
            Track your achievements and compete with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Level Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {gamificationData.level.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {gamificationData.level.currentXP} / {gamificationData.level.requiredXP} XP
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{gamificationData.totalPoints}</p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                </div>
                <Progress 
                  value={(gamificationData.level.currentXP / gamificationData.level.requiredXP) * 100} 
                  className="h-3"
                />
              </div>

              {/* Streak Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Streak</p>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          {gamificationData.streaks.current}
                          <Flame className="h-5 w-5 text-orange-500" />
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Leaderboard</p>
                        <p className="text-2xl font-bold">
                          #{gamificationData.leaderboardPosition}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Achievements */}
              <div>
                <h4 className="text-sm font-medium mb-3">Recent Achievements</h4>
                <div className="grid grid-cols-3 gap-3">
                  {gamificationData.achievements
                    .filter(a => a.unlocked)
                    .slice(0, 3)
                    .map(achievement => (
                      <Card key={achievement.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <achievement.icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs font-medium">{achievement.name}</p>
                          <Badge variant="secondary" className="mt-1">
                            +{achievement.points}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-5 gap-2 mb-4">
                {['onboarding', 'loans', 'documents', 'engagement', 'mastery'].map(category => {
                  const Icon = getCategoryIcon(category);
                  const categoryAchievements = gamificationData.achievements.filter(a => a.category === category);
                  const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;
                  
                  return (
                    <Button key={category} variant="outline" size="sm" className="flex flex-col h-auto py-2">
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs capitalize">{category}</span>
                      <span className="text-xs text-muted-foreground">
                        {unlockedCount}/{categoryAchievements.length}
                      </span>
                    </Button>
                  );
                })}
              </div>

              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-3">
                  {gamificationData.achievements.map(achievement => (
                    <Card 
                      key={achievement.id}
                      className={cn(
                        "relative overflow-hidden transition-all",
                        achievement.unlocked 
                          ? "hover:shadow-md cursor-pointer" 
                          : "opacity-60"
                      )}
                      onClick={() => achievement.unlocked && setShowAchievement(achievement)}
                    >
                      <div className={cn(
                        "absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full opacity-20",
                        rarityColors[achievement.rarity]
                      )} />
                      
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            achievement.unlocked ? "bg-primary/10" : "bg-muted"
                          )}>
                            <achievement.icon className={cn(
                              "h-6 w-6",
                              achievement.unlocked ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{achievement.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            {achievement.progress !== undefined && (
                              <div className="mt-2">
                                <Progress 
                                  value={(achievement.progress / (achievement.maxProgress || 1)) * 100} 
                                  className="h-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {achievement.progress} / {achievement.maxProgress}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant={achievement.unlocked ? "default" : "outline"} className="text-xs">
                                +{achievement.points} pts
                              </Badge>
                              {achievement.unlocked ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4">
              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Sarah Johnson', points: 5420, avatar: '👑' },
                  { rank: 2, name: 'Michael Chen', points: 4890, avatar: '🥈' },
                  { rank: 3, name: 'Emily Davis', points: 4550, avatar: '🥉' },
                  { rank: 41, name: 'James Wilson', points: 1120, avatar: '😎' },
                  { rank: 42, name: 'You', points: gamificationData.totalPoints, avatar: '🚀', isCurrentUser: true },
                  { rank: 43, name: 'Lisa Thompson', points: 1090, avatar: '💫' }
                ].map(user => (
                  <Card key={user.rank} className={cn(
                    "transition-all",
                    user.isCurrentUser && "ring-2 ring-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-muted-foreground">
                            #{user.rank}
                          </div>
                          <div className="text-2xl">{user.avatar}</div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.points.toLocaleString()} points
                            </p>
                          </div>
                        </div>
                        {user.rank <= 3 && (
                          <Trophy className={cn(
                            "h-5 w-5",
                            user.rank === 1 && "text-yellow-500",
                            user.rank === 2 && "text-gray-400",
                            user.rank === 3 && "text-orange-600"
                          )} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="challenges" className="space-y-4">
              {gamificationData.weeklyChallenge && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Weekly Challenge
                      </span>
                      <Badge variant="secondary">
                        {getTimeRemaining(gamificationData.weeklyChallenge.endsAt)} left
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">{gamificationData.weeklyChallenge.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {gamificationData.weeklyChallenge.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {gamificationData.weeklyChallenge.progress} / {gamificationData.weeklyChallenge.target}
                        </span>
                      </div>
                      <Progress 
                        value={(gamificationData.weeklyChallenge.progress / gamificationData.weeklyChallenge.target) * 100}
                        className="h-3"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Reward</span>
                      </div>
                      <Badge variant="default">
                        +{gamificationData.weeklyChallenge.reward} pts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-3">
                <h4 className="text-sm font-medium">Daily Tasks</h4>
                {[
                  { name: 'Check your dashboard', completed: true, points: 10 },
                  { name: 'Upload a document', completed: true, points: 25 },
                  { name: 'Review loan status', completed: false, points: 15 },
                  { name: 'Update profile information', completed: false, points: 20 }
                ].map((task, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-sm",
                            task.completed && "line-through text-muted-foreground"
                          )}>
                            {task.name}
                          </span>
                        </div>
                        <Badge variant={task.completed ? "secondary" : "outline"}>
                          +{task.points} pts
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Unlock Dialog */}
      <Dialog open={!!showAchievement} onOpenChange={() => setShowAchievement(null)}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">Achievement Unlocked! 🎉</DialogTitle>
          </DialogHeader>
          {showAchievement && (
            <div className="space-y-4 py-6">
              <div className={cn(
                "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
                "bg-primary/10"
              )}>
                <showAchievement.icon className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{showAchievement.name}</h3>
                <p className="text-muted-foreground mt-2">{showAchievement.description}</p>
              </div>
              <Badge variant="default" className="text-lg py-1">
                +{showAchievement.points} points
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}