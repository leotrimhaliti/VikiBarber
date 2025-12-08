import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Konfigurimi i routerit
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Faqja e Klientit
  },
  {
    path: "/admin",
    element: <AdminDashboard />, // Faqja e Administratorit
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);