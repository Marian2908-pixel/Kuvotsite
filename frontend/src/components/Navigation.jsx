import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Monitor,
  Truck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
  { path: "/", label: "Дашборд", icon: LayoutDashboard },
  { path: "/orders", label: "Замовлення", icon: ShoppingCart },
  { path: "/delivery", label: "Доставка", icon: Truck },
  { path: "/analytics", label: "Аналітика", icon: BarChart3 },
  { path: "/settings", label: "Налаштування", icon: Settings },
];

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="backdrop-blur-md bg-background/80 border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="font-bold text-2xl tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                kuvo
              </span>
              <span className="text-primary text-3xl font-light" style={{ marginLeft: '-2px' }}>†</span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
              Art
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
                data-testid={`nav-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                data-testid="theme-toggle"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Перемикання теми</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} data-testid="theme-light">
                <Sun className="mr-2 h-4 w-4" />
                Світла
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} data-testid="theme-dark">
                <Moon className="mr-2 h-4 w-4" />
                Темна
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} data-testid="theme-system">
                <Monitor className="mr-2 h-4 w-4" />
                Системна
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
