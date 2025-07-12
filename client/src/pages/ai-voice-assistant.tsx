import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Brain, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VoiceSession {
  id: string;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'complete';
  transcript: string;
  response: string;
  confidence: number;
  intent: string;
  extractedData: Record<string, any>;
}

interface CallMetrics {
  duration: number;
  wordsSpoken: number;
  dataPointsCollected: number;
  completionRate: number;
}

export default function AIVoiceAssistant() {
  const [session, setSession] = useState<VoiceSession>({
    id: '',
    status: 'idle',
    transcript: '',
    response: '',
    confidence: 0,
    intent: '',
    extractedData: {}
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [metrics, setMetrics] = useState<CallMetrics>({
    duration: 0,
    wordsSpoken: 0,
    dataPointsCollected: 0,
    completionRate: 0
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startVoiceSession = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/voice/start", "POST", {
        type: 'loan_application',
        language: 'en-US'
      });
    },
    onSuccess: (data) => {
      setSession(prev => ({ ...prev, id: data.sessionId, status: 'listening' }));
      setCallActive(true);
      startAudioVisualization();
      simulateConversation();
    }
  });

  const endVoiceSession = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/ai/voice/end/${session.id}`, "POST");
    },
    onSuccess: () => {
      setCallActive(false);
      setIsRecording(false);
      stopAudioVisualization();
      setSession(prev => ({ ...prev, status: 'complete' }));
    }
  });

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const updateVolume = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(average / 255 * 100);
        }
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const simulateConversation = () => {
    // Simulate a conversation flow
    const conversationSteps = [
      {
        delay: 2000,
        transcript: "Hi! I'm your AI loan assistant. How can I help you today?",
        response: "I can help you with loan applications, check rates, or answer questions.",
        intent: "greeting",
        status: 'speaking' as const
      },
      {
        delay: 5000,
        transcript: "I'd like to apply for a home loan",
        response: "Great! I'll help you with that. What's the property address?",
        intent: "loan_application",
        status: 'listening' as const,
        data: { purpose: 'home_loan' }
      },
      {
        delay: 8000,
        transcript: "123 Main Street, San Francisco, CA 94105",
        response: "Perfect! I found that property. It's valued at $850,000. How much would you like to borrow?",
        intent: 'property_info',
        status: 'processing' as const,
        data: { property_address: '123 Main Street, San Francisco, CA 94105', estimated_value: 850000 }
      },
      {
        delay: 11000,
        transcript: "I need to borrow $680,000",
        response: "That's an 80% loan-to-value ratio. What's your annual income?",
        intent: 'loan_amount',
        status: 'listening' as const,
        data: { loan_amount: 680000, ltv: 80 }
      },
      {
        delay: 14000,
        transcript: "My annual income is $150,000",
        response: "Excellent! Based on your information, you qualify for several loan options. Would you like me to show you the best rates?",
        intent: 'income_info',
        status: 'speaking' as const,
        data: { annual_income: 150000, dti_ratio: 38 }
      }
    ];

    let currentStep = 0;
    conversationSteps.forEach((step, index) => {
      setTimeout(() => {
        if (!callActive && index > 0) return;
        
        setSession(prev => ({
          ...prev,
          status: step.status,
          transcript: step.transcript,
          response: step.response,
          intent: step.intent,
          confidence: 85 + Math.random() * 15,
          extractedData: { ...prev.extractedData, ...step.data }
        }));

        setMetrics(prev => ({
          duration: prev.duration + 3,
          wordsSpoken: prev.wordsSpoken + step.transcript.split(' ').length,
          dataPointsCollected: Object.keys({ ...prev, ...step.data }).length,
          completionRate: ((index + 1) / conversationSteps.length) * 100
        }));
      }, step.delay);
    });
  };

  useEffect(() => {
    // Update duration every second
    const interval = setInterval(() => {
      if (callActive) {
        setMetrics(prev => ({ ...prev, duration: prev.duration + 1 }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [callActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Voice Assistant</h1>
        <p className="text-gray-600">
          Natural language loan processing powered by advanced AI - talk to apply for loans
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Voice Control Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Voice Assistant
                </span>
                {callActive && (
                  <Badge variant="default" className="bg-green-600">
                    <Phone className="w-3 h-3 mr-1" />
                    Active Call
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Voice Visualization */}
              <div className="mb-6">
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {callActive ? (
                      <div className="flex items-center gap-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-indigo-600 rounded-full transition-all duration-150"
                            style={{
                              height: `${20 + (volume * Math.sin((i / 20) * Math.PI)) * 0.6}%`,
                              opacity: 0.3 + (volume / 100) * 0.7
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <Mic className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex justify-center gap-4 mb-6">
                {!callActive ? (
                  <Button
                    size="lg"
                    onClick={() => startVoiceSession.mutate()}
                    disabled={startVoiceSession.isPending}
                  >
                    {startVoiceSession.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-5 w-5" />
                        Start Voice Call
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="mr-2 h-5 w-5" />
                          Mute
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-5 w-5" />
                          Unmute
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => endVoiceSession.mutate()}
                    >
                      <PhoneOff className="mr-2 h-5 w-5" />
                      End Call
                    </Button>
                  </>
                )}
              </div>

              {/* Conversation Display */}
              {session.status !== 'idle' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Volume2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">AI Assistant</p>
                        <p className="text-gray-600">{session.response || "Listening..."}</p>
                      </div>
                    </div>
                    {session.transcript && (
                      <div className="flex items-start gap-3 mt-3 pt-3 border-t">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mic className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">You</p>
                          <p className="text-gray-600">{session.transcript}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        session.status === 'listening' ? 'bg-green-500 animate-pulse' :
                        session.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                        session.status === 'speaking' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-gray-600 capitalize">{session.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>Confidence: {session.confidence.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics and Extracted Data */}
        <div className="space-y-6">
          {/* Call Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{formatDuration(metrics.duration)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Words Spoken</span>
                    <span className="font-medium">{metrics.wordsSpoken}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Data Collected</span>
                    <span className="font-medium">{metrics.dataPointsCollected} fields</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">{metrics.completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.completionRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Extracted Information</CardTitle>
              <CardDescription>
                Data collected during the conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(session.extractedData).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(session.extractedData).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-gray-600">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-sm font-medium">
                        {typeof value === 'number' && key.includes('amount') || key.includes('value') 
                          ? `$${value.toLocaleString()}`
                          : typeof value === 'number' && key.includes('ratio')
                          ? `${value}%`
                          : value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No data collected yet</p>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Voice Features:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Natural language understanding</li>
                <li>• Multi-language support</li>
                <li>• Real-time data extraction</li>
                <li>• Automated form filling</li>
                <li>• Call recording & transcription</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Success State */}
      {session.status === 'complete' && Object.keys(session.extractedData).length > 0 && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Voice Application Complete!
                </h3>
                <p className="text-green-800 text-sm mb-3">
                  We've collected all the necessary information. The loan application has been created and is ready for review.
                </p>
                <div className="flex gap-3">
                  <Button size="sm">View Application</Button>
                  <Button size="sm" variant="outline">Download Transcript</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}