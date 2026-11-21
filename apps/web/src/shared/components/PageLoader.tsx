import { Loader2 } from "lucide-react";

const PageLoader = () => {
  return (
    <div
      role="status"
      aria-label="Memuat halaman"
      className="flex min-h-[50dvh] items-center justify-center text-ink-faint"
    >
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
};

export default PageLoader;
