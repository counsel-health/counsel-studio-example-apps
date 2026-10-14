"use client";

import { usePathname } from "next/navigation";
import { useMobile } from "@/hooks/useMobile";
import { useState } from "react";
import {
  Home,
  ShoppingBag,
  User,
  Menu,
  MessageCircle,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavItem {
  icon: React.ReactNode;
  href: string;
  label: string;
}

type HeaderProps = {
  userAgent?: string;
};

export default function Header({ userAgent }: HeaderProps) {
  const pathname = usePathname();
  const isMobile = useMobile(userAgent);
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
      label: "Home",
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      href: "/dashboard/orders",
      label: "Orders",
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      href: "/dashboard/chat",
      label: "Chat with a doctor",
    },
    {
      icon: <FlaskConical className="h-5 w-5" />,
      href: "/dashboard/playground",
      label: "Playground",
    },
    {
      icon: <User className="h-5 w-5" />,
      href: "/dashboard/account",
      label: "Account",
    },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Studio Demo</h1>
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav>
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                      pathname === item.href
                        ? "bg-brand-200 text-gray-100"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTitle />
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full px-6">
                <div className="flex items-center justify-between py-4">
                  <h2 className="text-lg font-semibold text-primary">Menu</h2>
                </div>
                <nav className="flex-1">
                  <ul className="space-y-2">
                    {navItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-2 py-3 rounded-lg transition-colors",
                            pathname === item.href
                              ? "bg-brand-200 text-gray-100"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}
