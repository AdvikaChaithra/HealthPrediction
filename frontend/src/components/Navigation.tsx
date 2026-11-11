import { Home, History, User, LogOut, HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "history", label: "History", icon: History },
  { id: "about", label: "Profile", icon: User },
];

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { logout, user } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 hidden md:block">
              <span className="block text-lg font-bold text-gray-900 truncate">
                Hybrid Framework for Health Prediction
              </span>
              {user?.name && (
                <span className="block text-xs text-gray-500 truncate">Signed in as {user.name}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={currentPage === item.id ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                    currentPage === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
