import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, Play, Pause, Square, Download, Upload, Wand2,
  Camera, Mic, Settings, Sparkles, Film, Image, Music,
  FileVideo, Eye, Trash2, Edit, Share2, Clock, CheckCircle,
  AlertCircle, Loader2, ChevronRight, Home, Building, DollarSign,
  TrendingUp, MapPin, BedDouble, Bath, Car, Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoProject {
  id: string;
  title: string;
  type: 'property_tour' | 'market_analysis' | 'loan_presentation' | 'testimonial';
  status: 'draft' | 'processing' | 'completed' | 'failed';
  duration: number;
  createdAt: string;
  propertyData?: {
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    features: string[];
    images: string[];
  };
  settings: {
    style: string;
    voiceOver: boolean;
    music: boolean;
    branding: boolean;
    resolution: string;
  };
  outputUrl?: string;
  thumbnailUrl?: string;
  processingProgress?: number;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  preview: string;
  category: string;
  features: string[];
}

export default function VideoStudio() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectType, setProjectType] = useState('property_tour');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [videoSettings, setVideoSettings] = useState({
    style: 'modern',
    voiceOver: true,
    music: true,
    branding: true,
    resolution: '1080p',
    duration: 60
  });
  
  // Fetch video projects
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/videos/projects'],
    refetchInterval: 5000
  });
  
  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/videos/templates']
  });
  
  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate video');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Video Generation Started',
        description: 'AI is creating your video. This may take a few minutes.'
      });
      setShowNewProject(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete video');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Video Deleted',
        description: 'Video has been deleted successfully'
      });
      refetch();
    }
  });
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get video type icon
  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'property_tour':
        return <Home className="h-5 w-5 text-blue-600" />;
      case 'market_analysis':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'loan_presentation':
        return <DollarSign className="h-5 w-5 text-purple-600" />;
      case 'testimonial':
        return <Film className="h-5 w-5 text-orange-600" />;
      default:
        return <Video className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Mock templates
  const mockTemplates: VideoTemplate[] = [
    {
      id: '1',
      name: 'Luxury Property Showcase',
      description: 'High-end property tour with cinematic transitions',
      duration: 90,
      preview: '/templates/luxury.jpg',
      category: 'property_tour',
      features: ['Drone shots', 'Slow motion', 'Premium music']
    },
    {
      id: '2',
      name: 'Quick Home Tour',
      description: 'Fast-paced tour highlighting key features',
      duration: 60,
      preview: '/templates/quick.jpg',
      category: 'property_tour',
      features: ['Fast cuts', 'Upbeat music', 'Feature callouts']
    },
    {
      id: '3',
      name: 'Market Insights',
      description: 'Data-driven market analysis video',
      duration: 120,
      preview: '/templates/market.jpg',
      category: 'market_analysis',
      features: ['Charts', 'Statistics', 'Professional voiceover']
    }
  ];
  
  // Calculate stats
  const stats = {
    total: projects.length,
    completed: projects.filter((p: VideoProject) => p.status === 'completed').length,
    processing: projects.filter((p: VideoProject) => p.status === 'processing').length,
    totalMinutes: projects.reduce((sum: number, p: VideoProject) => sum + (p.duration || 0), 0)
  };
  
  const handleGenerateVideo = () => {
    const data = {
      type: projectType,
      template: selectedTemplate,
      settings: videoSettings,
      // Add property data or other relevant data
    };
    generateVideoMutation.mutate(data);
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Video Studio</h1>
          <p className="text-gray-600">
            Create professional property tours and marketing videos
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)}>
          <Wand2 className="h-4 w-4 mr-2" />
          Create Video
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}h</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">My Videos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Projects</CardTitle>
              <CardDescription>
                All your AI-generated videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading videos...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No videos created yet</p>
                  <Button className="mt-4" onClick={() => setShowNewProject(true)}>
                    Create Your First Video
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project: VideoProject) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-100 relative">
                          {project.thumbnailUrl ? (
                            <img 
                              src={project.thumbnailUrl} 
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              {getVideoTypeIcon(project.type)}
                            </div>
                          )}
                          
                          {project.status === 'completed' && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                              <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                          
                          {project.status === 'processing' && project.processingProgress && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                              <Progress value={project.processingProgress} className="h-2" />
                              <p className="text-xs text-white mt-1 text-center">
                                {project.processingProgress}% Complete
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold line-clamp-1">{project.title}</h3>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 space-x-4">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {project.duration}s
                            </span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {project.propertyData && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                              {project.propertyData.address}
                            </p>
                          )}
                          
                          <div className="flex space-x-2 mt-4">
                            {project.status === 'completed' && (
                              <>
                                <Button size="sm" className="flex-1"
                                  onClick={() => setSelectedProject(project)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {project.status === 'processing' && (
                              <Button size="sm" disabled className="flex-1">
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Processing
                              </Button>
                            )}
                            {project.status === 'failed' && (
                              <Button size="sm" variant="destructive" className="flex-1">
                                Retry
                              </Button>
                            )}
                            <Button size="sm" variant="ghost"
                              onClick={() => deleteVideoMutation.mutate(project.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Templates</CardTitle>
              <CardDescription>
                Professional templates for different video types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video bg-gray-100 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge>{template.category.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.duration}s duration
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full mt-4" size="sm"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setShowNewProject(true);
                        }}>
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average View Duration</span>
                    <span className="font-medium">45s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Views</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Engagement Rate</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shares</span>
                    <span className="font-medium">89</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Video Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Property Tours</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Market Analysis</span>
                      <span>20%</span>
                    </div>
                    <Progress value={20} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Loan Presentations</span>
                      <span>10%</span>
                    </div>
                    <Progress value={10} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Testimonials</span>
                      <span>5%</span>
                    </div>
                    <Progress value={5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Video Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Video</DialogTitle>
            <DialogDescription>
              Configure your AI-generated video project
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Video Type Selection */}
            <div>
              <Label>Video Type</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    projectType === 'property_tour' ? 'border-primary' : ''
                  }`}
                  onClick={() => setProjectType('property_tour')}
                >
                  <CardContent className="p-4 text-center">
                    <Home className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">Property Tour</h4>
                    <p className="text-sm text-gray-600">Showcase property features</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-colors ${
                    projectType === 'market_analysis' ? 'border-primary' : ''
                  }`}
                  onClick={() => setProjectType('market_analysis')}
                >
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">Market Analysis</h4>
                    <p className="text-sm text-gray-600">Data-driven insights</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Property Details (if property tour) */}
            {projectType === 'property_tour' && (
              <div className="space-y-4">
                <div>
                  <Label>Property Address</Label>
                  <Input placeholder="123 Main St, City, State" className="mt-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input type="number" placeholder="500000" className="mt-1" />
                  </div>
                  <div>
                    <Label>Square Feet</Label>
                    <Input type="number" placeholder="2500" className="mt-1" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Bedrooms</Label>
                    <Input type="number" placeholder="3" className="mt-1" />
                  </div>
                  <div>
                    <Label>Bathrooms</Label>
                    <Input type="number" placeholder="2" className="mt-1" />
                  </div>
                  <div>
                    <Label>Parking</Label>
                    <Input type="number" placeholder="2" className="mt-1" />
                  </div>
                </div>
                
                <div>
                  <Label>Key Features</Label>
                  <Textarea 
                    placeholder="Pool, Updated Kitchen, Hardwood Floors..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            {/* Video Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold">Video Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Style</Label>
                  <Select value={videoSettings.style} 
                    onValueChange={(value) => setVideoSettings({...videoSettings, style: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Clean</SelectItem>
                      <SelectItem value="luxury">Luxury & Elegant</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Resolution</Label>
                  <Select value={videoSettings.resolution}
                    onValueChange={(value) => setVideoSettings({...videoSettings, resolution: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Duration (seconds)</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <Slider 
                    value={[videoSettings.duration]}
                    onValueChange={(value) => setVideoSettings({...videoSettings, duration: value[0]})}
                    min={30}
                    max={180}
                    step={10}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{videoSettings.duration}s</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="voiceover">AI Voice Over</Label>
                  <Switch 
                    id="voiceover"
                    checked={videoSettings.voiceOver}
                    onCheckedChange={(checked) => setVideoSettings({...videoSettings, voiceOver: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="music">Background Music</Label>
                  <Switch 
                    id="music"
                    checked={videoSettings.music}
                    onCheckedChange={(checked) => setVideoSettings({...videoSettings, music: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="branding">Include Branding</Label>
                  <Switch 
                    id="branding"
                    checked={videoSettings.branding}
                    onCheckedChange={(checked) => setVideoSettings({...videoSettings, branding: checked})}
                  />
                </div>
              </div>
            </div>
            
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                AI will automatically generate professional video content based on your inputs.
                Processing typically takes 3-5 minutes.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNewProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateVideo} disabled={generateVideoMutation.isPending}>
                {generateVideoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Video Player Dialog */}
      {selectedProject && selectedProject.status === 'completed' && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedProject.title}</DialogTitle>
              <DialogDescription>
                {selectedProject.type.replace('_', ' ').toUpperCase()} • 
                {' '}{selectedProject.duration}s • 
                {' '}{selectedProject.settings.resolution}
              </DialogDescription>
            </DialogHeader>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedProject.outputUrl ? (
                <video 
                  src={selectedProject.outputUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <Play className="h-16 w-16" />
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <Badge variant="outline">
                  {selectedProject.settings.style}
                </Badge>
                {selectedProject.settings.voiceOver && (
                  <Badge variant="outline">Voice Over</Badge>
                )}
                {selectedProject.settings.music && (
                  <Badge variant="outline">Music</Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}