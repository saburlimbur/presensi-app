import { Outlet, useLocation, useNavigate, useMatches } from "react-router-dom";
import { Suspense, useEffect, useRef, useState } from "react";
import NavigationMenu from "@components/NavigationMenu";
import PageLoader from "@components/PageLoader";
import ProfileHeader from "@features/users/components/ProfileHeader";
import { ChevronLeft } from "lucide-react";
import NotificationDropdown from "@components/NotificationDropdown";
import { useAuthStore } from "@features/auth/store/auth.store";
import { useNotificationStream } from "@hooks/notifications/useNotificationStream";

const AppLayouts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();

  const headerRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  const isAuthPage = location.pathname.startsWith("/auth");
  const isRoot = location.pathname === "/";
  const isHome = location.pathname === "/home";

  const hideNavbar = isAuthPage || isRoot;

  const accessToken = useAuthStore((s) => s.accessToken);
  useNotificationStream(!!accessToken && !isAuthPage && !isRoot);

  const currentMatch = matches[matches.length - 1];
  const meta = currentMatch?.handle as
    | { title?: string; description?: string }
    | undefined;

  const title = meta?.title ?? "Page";
  const description = meta?.description ?? "";

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const updateHeights = () => {
      setHeaderHeight(
        headerRef.current
          ? headerRef.current.offsetHeight + 20
          : 0,
      );
      setNavHeight(
        navRef.current ? navRef.current.offsetHeight + 28 : 0,
      );
    };

    updateHeights();
    window.addEventListener("resize", updateHeights);
    const obs = new ResizeObserver(updateHeights);
    if (headerRef.current) obs.observe(headerRef.current);
    if (navRef.current) obs.observe(navRef.current);

    return () => {
      window.removeEventListener("resize", updateHeights);
      obs.disconnect();
    };
  }, [hideNavbar]);

  return (
    <main className="h-dvh max-w-105 mx-auto bg-paper relative overflow-hidden">
      {!isAuthPage && !isRoot && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 z-50">
          <header
            ref={headerRef}
            className="bg-paper-raised/90 backdrop-blur-md border border-line rounded-2xl px-4 py-4 shadow-[0_1px_0_0_rgba(21,20,15,0.02)]"
          >
            {isHome ? (
              <ProfileHeader />
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Kembali"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-muted active:bg-muted/70 transition shrink-0"
                >
                  <ChevronLeft size={20} strokeWidth={2.2} />
                </button>

                <div className="flex-1 items-center text-center min-w-0 py-0.5">
                  <h1 className="text-[15px] font-semibold text-ink truncate leading-tight tracking-tight">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-[11px] text-ink-muted truncate leading-tight mt-1">
                      {description}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <NotificationDropdown />
                </div>
              </div>
            )}
          </header>
        </div>
      )}

      <div
        className={`h-full overflow-y-auto no-scrollbar ${hideNavbar ? "px-0" : "px-5"}`}
        style={{
          paddingTop: headerHeight,
          paddingBottom: hideNavbar ? 0 : navHeight,
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>

      {!hideNavbar && (
        <div
          ref={navRef}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 z-50"
        >
          <NavigationMenu />
        </div>
      )}
    </main>
  );
};

export default AppLayouts;
