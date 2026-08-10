import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/auth/AuthProvider.tsx";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Refetching on focus matters more here than the churn it costs: card
      // images are signed URLs with a finite TTL, and re-signing only happens
      // when their query refetches. Returning to the tab or resuming the
      // installed PWA is exactly the moment stale data and dying URLs need
      // replacing.
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
