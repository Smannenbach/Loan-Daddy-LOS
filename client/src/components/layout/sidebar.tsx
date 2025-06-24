import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Plus, 
  FolderOpen, 
  FileText, 
  Calculator, 
  ChartBar, 
  Settings, 
  User,
  LogOut
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'New Application', href: '/new-application', icon: Plus },
  { name: 'Loan Pipeline', href: '/pipeline', icon: FolderOpen },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Underwriting', href: '/underwriting', icon: Calculator },
  { name: 'Reports', href: '/reports', icon: ChartBar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">LoanFlow Pro</h1>
            <p className="text-sm text-text-secondary">Commercial LOS</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "text-primary bg-blue-50"
                    : "text-text-secondary hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
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
