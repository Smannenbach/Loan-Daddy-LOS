import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Award, 
  Crown, 
  Star,
  Target,
  Mail,
  ExternalLink,
  Lock,
  CheckCircle,
  Sparkles
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  points: number;
}

interface AchievementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: Achievement[];
  totalPoints: number;
  level: number;
}

export function AchievementPanel({
  open,
  onOpenChange,
  achievements,
  totalPoints,
  level,
}: AchievementPanelProps) {
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const getAchievementIcon = (achievement: Achievement) => {
    const IconComponent = achievement.icon;
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        achievement.unlocked 
          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' 
          : 'bg-gray-100 text-gray-400'
      }`}>
        {achievement.unlocked ? (
          <IconComponent className="w-6 h-6" />
        ) : (
          <Lock className="w-6 h-6" />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements & Progress
          </DialogTitle>
        </DialogHeader>

        {/* Player Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Current Level</p>
                  <p className="text-3xl font-bold">{level}</p>
                </div>
                <Crown className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Total Points</p>
                  <p className="text-3xl font-bold">{totalPoints.toLocaleString()}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Achievements</p>
                  <p className="text-3xl font-bold">{unlockedAchievements.length}/{achievements.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Unlocked Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {getAchievementIcon(achievement)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-green-900">{achievement.title}</h4>
                          <Badge className="bg-green-600 text-white">
                            +{achievement.points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={100} className="flex-1 h-2" />
                          <span className="text-xs text-green-600 font-medium">Complete!</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-500" />
            In Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedAchievements.map((achievement) => (
              <Card key={achievement.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {getAchievementIcon(achievement)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                        <Badge variant="outline">
                          +{achievement.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium">
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Keep networking to unlock more achievements!
            </div>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}