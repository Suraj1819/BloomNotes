// src/App.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { useActivityTracker } from './hooks/useActivityTracker.js';
import { PageLoader } from './components/ui/Spinner.jsx';

// Lazy-loaded pages (code-splitting).
const Landing          = lazy(() => import('./pages/public/Landing.jsx'));
const Login            = lazy(() => import('./pages/public/Login.jsx'));
const Register         = lazy(() => import('./pages/public/Register.jsx'));
const ForgotPassword   = lazy(() => import('./pages/public/ForgotPassword.jsx'));
const ResetPassword    = lazy(() => import('./pages/public/ResetPassword.jsx'));
const VerifyEmail      = lazy(() => import('./pages/public/VerifyEmail.jsx'));

const AppLayout        = lazy(() => import('./components/layout/AppLayout.jsx'));
const Dashboard        = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
const AllNotes         = lazy(() => import('./pages/notes/AllNotes.jsx'));
const NoteEditor       = lazy(() => import('./pages/notes/NoteEditor.jsx'));
const Favorites        = lazy(() => import('./pages/notes/Favorites.jsx'));
const Pinned           = lazy(() => import('./pages/notes/Pinned.jsx'));
const Recent           = lazy(() => import('./pages/notes/Recent.jsx'));
const Trash            = lazy(() => import('./pages/notes/Trash.jsx'));
const FoldersPage      = lazy(() => import('./pages/folders/FoldersPage.jsx'));
const FolderView       = lazy(() => import('./pages/folders/FolderView.jsx'));
const Journal          = lazy(() => import('./pages/journal/Journal.jsx'));
const PersonalSpace    = lazy(() => import('./pages/personal-space/PersonalSpace.jsx'));
const Vault            = lazy(() => import('./pages/vault/Vault.jsx'));
const Reminders        = lazy(() => import('./pages/reminders/Reminders.jsx'));
const Settings         = lazy(() => import('./pages/settings/Settings.jsx'));
const Search           = lazy(() => import('./pages/dashboard/Search.jsx'));

function PublicRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/app" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  useActivityTracker();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

        {/* Protected */}
        <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="notes" element={<AllNotes />} />
          <Route path="notes/:id" element={<NoteEditor />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="pinned" element={<Pinned />} />
          <Route path="recent" element={<Recent />} />
          <Route path="trash" element={<Trash />} />
          <Route path="folders" element={<FoldersPage />} />
          <Route path="folders/:id" element={<FolderView />} />
          <Route path="journal" element={<Journal />} />
          <Route path="personal-space" element={<PersonalSpace />} />
          <Route path="vault" element={<Vault />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
