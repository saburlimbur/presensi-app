import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import PageLoader from "@components/PageLoader";

const AuthLayouts = () => {
  return (
    <main className="min-h-screen max-w-[420px] mx-auto bg-muted flex flex-col relative">
      <div className="flex-1 overflow-y-auto w-full">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
};

export default AuthLayouts;
