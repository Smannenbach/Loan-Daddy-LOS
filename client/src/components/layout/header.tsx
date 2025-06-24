import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewLoan?: () => void;
}

export default function Header({ title, subtitle, onNewLoan }: HeaderProps) {
  const [, navigate] = useLocation();

  const handleNewLoan = () => {
    if (onNewLoan) {
      onNewLoan();
    } else {
      navigate("/new-application");
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          {subtitle && (
            <p className="text-text-secondary">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="relative p-2 text-text-secondary hover:text-text-primary">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
          <Button 
            onClick={handleNewLoan}
            className="bg-primary text-white hover:bg-primary-dark transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Loan</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
