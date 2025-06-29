import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkoutList } from './components/workouts/WorkoutList';
import { CreateWorkout } from './components/workouts/CreateWorkout';
import { EditWorkout } from './components/workouts/EditWorkout';
import { WorkoutSession } from './components/workouts/WorkoutSession';
import { RoutineList } from './components/routines/RoutineList';
import { FoodTracker } from './components/food/FoodTracker';
import { ProfileSettings } from './components/profile/ProfileSettings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginForm />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupForm />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <ProtectedRoute>
                <WorkoutList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/new"
            element={
              <ProtectedRoute>
                <CreateWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/:id/edit"
            element={
              <ProtectedRoute>
                <EditWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/:id/start"
            element={
              <ProtectedRoute>
                <WorkoutSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routines"
            element={
              <ProtectedRoute>
                <RoutineList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/food"
            element={
              <ProtectedRoute>
                <FoodTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;