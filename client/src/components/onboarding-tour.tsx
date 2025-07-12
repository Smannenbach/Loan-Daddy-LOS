import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  X, ChevronLeft, ChevronRight, CheckCircle, 
  Sparkles, HelpCircle, Play, Pause, RotateCcw
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
  spotlight?: boolean;
  interactive?: boolean;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  isActive?: boolean;
}

const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to LoanGenius! 👋',
    content: 'Let\'s take a quick tour to help you get started with our AI-powered loan platform.',
    target: 'body',
    position: 'bottom',
    spotlight: false
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    content: 'This is your command center. See all your loan applications, tasks, and important metrics at a glance.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'create-loan',
    title: 'Create a Loan Application',
    content: 'Click here to start a new loan application. Our AI will guide you through the process.',
    target: '[data-tour="create-loan"]',
    position: 'right',
    spotlight: true,
    interactive: true
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    content: 'Need help? Our AI assistant is always here to answer questions and provide guidance.',
    target: '[data-tour="ai-assistant"]',
    position: 'left',
    spotlight: true
  },
  {
    id: 'document-upload',
    title: 'Smart Document Upload',
    content: 'Upload documents here. Our AI will automatically recognize and categorize them for you.',
    target: '[data-tour="documents"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'property-search',
    title: 'Property Search',
    content: 'Search for properties and get instant valuations, tax estimates, and market insights.',
    target: '[data-tour="property-search"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'gamification',
    title: 'Track Your Progress',
    content: 'Earn points and unlock achievements as you use the platform. Check your progress here!',
    target: '[data-tour="gamification"]',
    position: 'left',
    spotlight: true
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    content: 'That\'s it! You\'re ready to start using LoanGenius. Remember, help is always just a click away.',
    target: 'body',
    position: 'bottom',
    spotlight: false
  }
];

export default function OnboardingTour({ 
  steps = defaultSteps, 
  onComplete, 
  onSkip,
  isActive = true 
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const currentTourStep = steps[currentStep];

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    // Check if user has completed tour before
    const hasCompletedTour = localStorage.getItem('onboardingTourCompleted');
    if (hasCompletedTour && !window.location.search.includes('tour=true')) {
      return;
    }

    // Start tour after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      positionTooltip();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive]);

  useEffect(() => {
    if (isVisible && !isPaused) {
      positionTooltip();
      window.addEventListener('resize', positionTooltip);
      window.addEventListener('scroll', positionTooltip);

      return () => {
        window.removeEventListener('resize', positionTooltip);
        window.removeEventListener('scroll', positionTooltip);
      };
    }
  }, [currentStep, isVisible, isPaused]);

  const positionTooltip = () => {
    if (!tooltipRef.current || !currentTourStep) return;

    const targetElement = document.querySelector(currentTourStep.target);
    if (!targetElement || currentTourStep.target === 'body') {
      // Center the tooltip for body-level steps
      const { innerWidth, innerHeight } = window;
      setTooltipPosition({
        top: innerHeight / 2 - 100,
        left: innerWidth / 2 - 200
      });
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 20;

    let top = 0;
    let left = 0;

    switch (currentTourStep.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - padding;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + padding;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setTooltipPosition({ top, left });

    // Update spotlight position
    if (currentTourStep.spotlight && spotlightRef.current) {
      spotlightRef.current.style.top = `${targetRect.top - 10}px`;
      spotlightRef.current.style.left = `${targetRect.left - 10}px`;
      spotlightRef.current.style.width = `${targetRect.width + 20}px`;
      spotlightRef.current.style.height = `${targetRect.height + 20}px`;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingTourSkipped', 'true');
    onSkip?.();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingTourCompleted', 'true');
    onComplete?.();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPaused(false);
    positionTooltip();
  };

  if (!isVisible || !currentTourStep) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[9998] transition-opacity duration-300",
          isPaused ? "bg-black/20" : "bg-black/50"
        )}
        onClick={currentTourStep.interactive ? undefined : handleNext}
      />

      {/* Spotlight */}
      {currentTourStep.spotlight && !isPaused && (
        <div
          ref={spotlightRef}
          className="fixed z-[9999] pointer-events-none transition-all duration-300"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px'
          }}
        />
      )}

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className={cn(
          "fixed z-[10000] w-96 shadow-2xl transition-all duration-300",
          isPaused && "opacity-50"
        )}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`
        }}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePause}
                className="h-8 w-8 p-0"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRestart}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <Progress 
            value={(currentStep + 1) / steps.length * 100} 
            className="h-1 mb-4"
          />

          {/* Content */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{currentTourStep.title}</h3>
            <p className="text-sm text-muted-foreground">{currentTourStep.content}</p>
            
            {currentTourStep.action && (
              <Button
                size="sm"
                onClick={currentTourStep.action.onClick}
                className="w-full"
              >
                {currentTourStep.action.label}
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <Button
              size="sm"
              variant="link"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Complete
                  <CheckCircle className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Button */}
      <Button
        size="sm"
        variant="secondary"
        className="fixed bottom-4 right-4 z-[10001] shadow-lg"
        onClick={() => setIsPaused(!isPaused)}
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        {isPaused ? 'Resume Tour' : 'Pause Tour'}
      </Button>
    </>,
    document.body
  );
}

// Hook to programmatically control the tour
export function useOnboardingTour() {
  const [isActive, setIsActive] = useState(false);

  const startTour = () => {
    localStorage.removeItem('onboardingTourCompleted');
    localStorage.removeItem('onboardingTourSkipped');
    setIsActive(true);
  };

  const resetTour = () => {
    localStorage.removeItem('onboardingTourCompleted');
    localStorage.removeItem('onboardingTourSkipped');
  };

  const isTourCompleted = () => {
    return !!localStorage.getItem('onboardingTourCompleted');
  };

  return {
    isActive,
    startTour,
    resetTour,
    isTourCompleted
  };
}