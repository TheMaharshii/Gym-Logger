import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Play, Clock, Calendar, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Workout {
  id: string;
  title: string;
  completed_at: string | null;
  duration: number | null;
  created_at: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number | null;
  }>;
}

export function WorkoutList() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises (*)
        `)
        .eq('user_id', user!.id)
        .eq('is_routine', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setDeletingId(workoutId);
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user!.id);

      if (error) throw error;
      
      setWorkouts(workouts.filter(w => w.id !== workoutId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting workout:', error);
      alert('Error deleting workout. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleDropdown = (workoutId: string) => {
    setActiveDropdown(activeDropdown === workoutId ? null : workoutId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workouts</h1>
          <p className="text-gray-400">Create and track your workout sessions</p>
        </div>
        <Link
          to="/workouts/new"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Workout
        </Link>
      </div>

      {workouts.length > 0 ? (
        <div className="grid gap-6">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{workout.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(parseISO(workout.created_at), 'MMM d, yyyy')}
                    </span>
                    {workout.completed_at && workout.duration && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(workout.duration)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {workout.completed_at ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300">
                      Completed
                    </span>
                  ) : (
                    <Link
                      to={`/workouts/${workout.id}/start`}
                      className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Link>
                  )}
                  
                  {/* Dropdown Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(workout.id);
                      }}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {activeDropdown === workout.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          <Link
                            to={`/workouts/${workout.id}/edit`}
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Workout
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(workout.id);
                              setActiveDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Workout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {workout.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Exercises:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {workout.exercises.slice(0, 6).map((exercise) => (
                      <div
                        key={exercise.id}
                        className="bg-gray-800 rounded-lg p-3"
                      >
                        <p className="text-white font-medium text-sm">{exercise.name}</p>
                        <p className="text-gray-400 text-xs">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight && ` @ ${exercise.weight}lbs`}
                        </p>
                      </div>
                    ))}
                    {workout.exercises.length > 6 && (
                      <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">
                          +{workout.exercises.length - 6} more
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <Play className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No workouts yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first workout to start tracking your fitness journey.
            </p>
            <Link
              to="/workouts/new"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Workout
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete Workout</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWorkout(showDeleteConfirm)}
                disabled={deletingId === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors"
              >
                {deletingId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}