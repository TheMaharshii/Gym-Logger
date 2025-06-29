import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Play, Pause, Square, Save } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
}

export function WorkoutSession() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchWorkout();
    }
  }, [id, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const fetchWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises (*)
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setWorkout(data);
    } catch (error) {
      console.error('Error fetching workout:', error);
      navigate('/workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
    setStartTime(Date.now() - elapsedTime * 1000);
  };

  const handleFinish = async () => {
    if (!workout) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workouts')
        .update({
          completed_at: new Date().toISOString(),
          duration: elapsedTime,
        })
        .eq('id', workout.id);

      if (error) throw error;

      // Show completion modal or navigate to summary
      navigate('/workouts', { 
        state: { 
          completed: true, 
          workoutTitle: workout.title, 
          duration: elapsedTime,
          exercises: workout.exercises.length 
        } 
      });
    } catch (error) {
      console.error('Error finishing workout:', error);
      alert('Error finishing workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsRoutine = async () => {
    if (!workout) return;

    try {
      // Create a new routine based on this workout
      const { data: routine, error: routineError } = await supabase
        .from('workouts')
        .insert({
          user_id: user!.id,
          title: `${workout.title} (Routine)`,
          is_routine: true,
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // Copy exercises to the routine
      const exerciseInserts = workout.exercises.map(exercise => ({
        workout_id: routine.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exerciseInserts);

      if (exercisesError) throw exercisesError;

      alert('Workout saved as routine!');
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Error saving routine. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Workout not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/workouts')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{workout.title}</h1>
          <p className="text-gray-400">Workout Session</p>
        </div>
      </div>

      {/* Timer Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
        <div className="mb-4">
          <div className="text-4xl font-bold text-white mb-2">
            {formatTime(elapsedTime)}
          </div>
          <p className="text-gray-400">
            {isRunning ? 'Workout in progress' : startTime ? 'Workout paused' : 'Ready to start'}
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          {!startTime ? (
            <button
              onClick={handleStart}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </button>
          ) : (
            <>
              {isRunning ? (
                <button
                  onClick={handlePause}
                  className="inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </button>
              )}
              <button
                onClick={handleFinish}
                disabled={saving}
                className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <Square className="h-5 w-5 mr-2" />
                {saving ? 'Finishing...' : 'Finish'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Exercises */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Exercises ({workout.exercises.length})
        </h2>
        
        <div className="space-y-4">
          {workout.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="p-4 bg-gray-800 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{exercise.name}</h3>
                <span className="text-sm text-gray-400">Exercise {index + 1}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>{exercise.sets} sets</span>
                <span>{exercise.reps} reps</span>
                {exercise.weight && <span>{exercise.weight} lbs</span>}
              </div>
            </div>
          ))}
        </div>

        {startTime && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <button
              onClick={handleSaveAsRoutine}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="h-5 w-5 mr-2" />
              Save as Routine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}