import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Play, Calendar, Dumbbell, Copy } from 'lucide-react';

interface Routine {
  id: string;
  title: string;
  created_at: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number | null;
  }>;
}

export function RoutineList() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user]);

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises (*)
        `)
        .eq('user_id', user!.id)
        .eq('is_routine', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseRoutine = async (routine: Routine) => {
    try {
      // Create a new workout based on the routine
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user!.id,
          title: routine.title,
          is_routine: false,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Copy exercises from routine to new workout
      const exerciseInserts = routine.exercises.map(exercise => ({
        workout_id: workout.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exerciseInserts);

      if (exercisesError) throw exercisesError;

      // Navigate to start the workout
      window.location.href = `/workouts/${workout.id}/start`;
    } catch (error) {
      console.error('Error creating workout from routine:', error);
      alert('Error starting workout. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Routines</h1>
        <p className="text-gray-400">Your saved workout routines ready to use</p>
      </div>

      {routines.length > 0 ? (
        <div className="grid gap-6">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{routine.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Created {new Date(routine.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      {routine.exercises.length} exercises
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUseRoutine(routine)}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Workout
                </button>
              </div>

              {routine.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Exercises:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {routine.exercises.map((exercise) => (
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
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <Copy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No routines yet</h3>
            <p className="text-gray-400 mb-6">
              Complete a workout and save it as a routine to see it here.
            </p>
            <Link
              to="/workouts/new"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Dumbbell className="h-5 w-5 mr-2" />
              Create Your First Workout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}