import { CalendarDays, FileText, Fingerprint, Home, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import type { MenuItem } from "@shared/@types/navigation";

const menuItems: MenuItem[] = [
  {
    label: "Home",
    icon: Home,
    href: "/home",
    value: "home",
  },
  {
    label: "Attendance",
    icon: Fingerprint,
    href: "/attendance",
    value: "attendance",
  },
  {
    label: "Schedule",
    icon: CalendarDays,
    href: "/schedule",
    value: "schedule",
  },
  {
    label: "Request",
    icon: FileText,
    href: "/request",
    value: "request",
  },
  {
    label: "Profile",
    icon: User,
    href: "/profile",
    value: "profile",
  },
];

const NavigationMenu = () => {
  const location = useLocation();
  const activeTab =
    menuItems.find((item) => item.href === location.pathname)?.value || "home";

  return (
    <nav className="relative flex items-center justify-between bg-paper-raised/92 backdrop-blur-md border border-line rounded-2xl px-1.5 py-3">
      {menuItems.map((item) => {
        const isActive = activeTab === item.value;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className="relative flex-1 flex flex-col items-center justify-evenly h-full no-underline"
          >
            <div className="relative flex items-center justify-center w-11 h-9">
              {isActive && (
                <motion.div
                  layoutId="activeCircle"
                  className="absolute inset-0 bg-brand rounded-xl"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              <motion.div
                animate={{
                  color: isActive ? "#FFFFFF" : "#9A9C98",
                  scale: 0.9,
                }}
                className="relative z-10"
              >
                <Icon size={18} strokeWidth={2} />
              </motion.div>
            </div>

            <motion.span
              animate={{
                opacity: isActive ? 0 : 1,
                y: isActive ? 4 : 0,
              }}
              className="text-[9px] text-ink-faint font-semibold mt-0.5 tracking-tight uppercase"
            >
              {!isActive && item.label}
            </motion.span>

            <motion.div
              whileTap={{ scale: 0.95 }}
              className="absolute inset-0 z-0 rounded-full"
            />
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;
