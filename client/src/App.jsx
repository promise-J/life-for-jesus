import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './state/AppContext.jsx';
import { MainMenu } from './screens/MainMenu.jsx';
import { NewGame } from './screens/NewGame.jsx';
import { LifeReportScreen } from './screens/LifeReport.jsx';
import { Button, Spinner } from './components/ui.jsx';

const GameScreen = lazy(() => import('./screens/GameScreen.jsx'));

function Loading({ label }) {
  return (
    <div className="adire-bg h-full flex items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}

function RequireUser({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Opening the city gates…" />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { loading, bootError, retry } = useAuth();
  if (loading) return <Loading label="Opening the city gates…" />;
  if (bootError)
    return (
      <div className="adire-bg h-full flex items-center justify-center p-6">
        <div className="sticker bg-paper rounded-3xl p-6 max-w-md">
          <h1 className="font-display text-3xl font-extrabold mb-2">Can’t reach the game server</h1>
          <p className="mb-4">{bootError.message} Make sure the server is running, then try again.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      </div>
    );
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/new" element={<RequireUser><NewGame /></RequireUser>} />
      <Route
        path="/play/:id"
        element={
          <RequireUser>
            <Suspense fallback={<Loading label="Loading the world…" />}>
              <GameScreen />
            </Suspense>
          </RequireUser>
        }
      />
      <Route path="/report/:id" element={<RequireUser><LifeReportScreen /></RequireUser>} />
      <Route
        path="*"
        element={
          <div className="adire-bg h-full flex items-center justify-center p-6">
            <div className="sticker bg-paper rounded-3xl p-6 text-center">
              <h1 className="font-display text-3xl font-extrabold mb-3">This street doesn’t exist</h1>
              <Link className="btn btn-gold inline-block" to="/">Back to the main menu</Link>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
