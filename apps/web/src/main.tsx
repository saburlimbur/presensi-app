import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { Toaster } from "@ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@lib/react-query";
import { InstallPrompt } from "@components/InstallPrompt";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
      <InstallPrompt />
    </QueryClientProvider>
  </StrictMode>,
);
