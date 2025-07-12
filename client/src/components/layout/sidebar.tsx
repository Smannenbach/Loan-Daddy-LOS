import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Plus, 
  FolderOpen, 
  FileText, 
  Calculator, 
  ChartBar, 
  MessageSquare,
  Settings, 
  User,
  LogOut,
  Bot,
  Share2,
  UserCheck,
  MapPin,
  TrendingUp,
  Brain,
  Users,
  Shield,
  Target,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Menu
} from "lucide-react";
import { useState } from "react";

// Simplified navigation with main categories
const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Pipeline', href: '/pipeline', icon: FolderOpen },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Properties', href: '/property-search', icon: MapPin },
  { name: 'AI Tools', href: '/ai-advisor', icon: Brain },
];

// Additional tools in dropdown menu
const additionalNavigation = {
  loans: [
    { name: 'New Application', href: '/new-application', icon: Plus },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Underwriting', href: '/underwriting', icon: Calculator },
    { name: 'Document Center', href: '/document-center', icon: FileText },
  ],
  crm: [
    { name: 'Communications', href: '/communications', icon: MessageSquare },
    { name: 'Contact Recommendations', href: '/contact-recommendations', icon: Target },
    { name: 'Marketing', href: '/marketing', icon: Share2 },
  ],
  properties: [
    { name: 'Property Map', href: '/property-map', icon: MapPin },
    { name: 'Property Comparison', href: '/property-comparison', icon: BarChart3 },
    { name: 'Property Tax Manager', href: '/property-tax-manager', icon: DollarSign },
  ],
  ai: [
    { name: 'AI Dashboard', href: '/ai-dashboard', icon: Bot },
  ],
  operations: [
    { name: 'Analytics', href: '/analytics', icon: ChartBar },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Team Management', href: '/team-management', icon: UserCheck },
    { name: 'Workflow Automation', href: '/workflow-automation', icon: Settings },
    { name: 'Compliance', href: '/compliance', icon: Shield },
    { name: 'Customer Portal', href: '/customer-portal', icon: UserCheck },
  ],
};

export default function Sidebar() {
  const [location] = useLocation();
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">LoanGenius</h1>
            <p className="text-sm text-text-secondary">Enterprise LOS</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {mainNavigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-text-secondary hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
        
        {/* More Options */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium text-text-secondary hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Menu className="w-5 h-5" />
              <span>More Tools</span>
            </div>
            {showMore ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {showMore && (
            <div className="mt-2 space-y-1 pl-4">
              {/* Loan Processing */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">Loan Processing</p>
                {additionalNavigation.loans.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                          isActive
                            ? "text-primary bg-blue-50"
                            : "text-text-secondary hover:bg-gray-50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              
              {/* CRM */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">CRM</p>
                {additionalNavigation.crm.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                          isActive
                            ? "text-primary bg-blue-50"
                            : "text-text-secondary hover:bg-gray-50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              
              {/* Operations */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">Operations</p>
                {additionalNavigation.operations.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                          isActive
                            ? "text-primary bg-blue-50"
                            : "text-text-secondary hover:bg-gray-50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Sarah Johnson</p>
            <p className="text-xs text-text-secondary">Senior Loan Officer</p>
          </div>
          <button className="text-text-secondary hover:text-text-primary">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
