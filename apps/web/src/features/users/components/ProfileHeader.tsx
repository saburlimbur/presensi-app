import { LogOut, Moon, Sun, Sunrise, Sunset, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "@components/NotificationDropdown";
import {
  Avatar,
  AvatarFallback,
} from "@ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import { useLogout } from "@features/auth/hooks/useLogout";
import { useProfileUser } from "@features/users/hooks/useProfile";

const getGreeting = (h: number) => {
  if (h < 11) return { label: "Good Morning", Icon: Sunrise };
  if (h < 15) return { label: "Good Afternoon", Icon: Sun };
  if (h < 18) return { label: "Good Evening", Icon: Sunset };
  return { label: "Good Night", Icon: Moon };
};

const ProfileHeader = () => {
  const navigate = useNavigate();
  const logout = useLogout();
  const { userProfile } = useProfileUser();

  const fullName = userProfile?.fullName ?? "Employee";
  const email = userProfile?.email ?? "";
  const { label, Icon } = getGreeting(new Date().getHours());

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-ink-muted" />
          <p className="eyebrow normal-case tracking-normal text-[11px] font-medium text-ink-muted">
            {label},
          </p>
        </div>
        <h2 className="text-base font-semibold text-ink truncate leading-tight tracking-tight mt-0.5">
          {fullName}
        </h2>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Buka menu akun"
            className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <Avatar size="default">
              <AvatarFallback className="text-[11px] font-semibold">
                {fullName.trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-paper-raised" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2.5 py-2">
              <p className="text-sm font-semibold text-ink truncate">
                {fullName}
              </p>
              {email && (
                <p className="text-[11px] text-ink-muted truncate mt-0.5">
                  {email}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="text-xs gap-2"
            >
              <User size={14} className="text-ink-muted" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-xs gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut size={14} />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationDropdown />
      </div>
    </div>
  );
};

export default ProfileHeader;
