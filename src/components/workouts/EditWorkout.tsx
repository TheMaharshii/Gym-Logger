import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, X, Sparkles, Save } from 'lucide-react';

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

export function EditWorkout() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: null as number | null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchWorkout();
    }
  }, [id, user]);

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
      setTitle(data.title);
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Error fetching workout:', error);
      navigate('/workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    if (!currentExercise.name.trim()) return;

    const newExercise = {
      id: `temp-${Date.now()}`, // Temporary ID for new exercises
      ...currentExercise,
    };

    setExercises([...exercises, newExercise]);
    setCurrentExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: null,
    });
    setAiSuggestions([]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleGetSuggestions = async () => {
    if (!currentExercise.name.trim()) return;

    setLoadingSuggestions(true);
    try {
      const mockSuggestions = getSuggestionsForExercise(currentExercise.name);
      setAiSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getSuggestionsForExercise = (input: string): string[] => {
    const exerciseDatabase = {
      chest: ['Push-ups', 'Bench Press', 'Dumbbell Flyes', 'Incline Press', 'Dips'],
      back: ['Pull-ups', 'Rows', 'Lat Pulldown', 'Deadlifts', 'Face Pulls'],
      shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Flyes', 'Shrugs'],
      arms: ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls', 'Tricep Dips', 'Preacher Curls'],
      legs: ['Squats', 'Lunges', 'Leg Press', 'Calf Raises', 'Leg Curls'],
      core: ['Planks', 'Crunches', 'Russian Twists', 'Mountain Climbers', 'Dead Bugs'],
    };

    const inputLower = input.toLowerCase();
    const suggestions: string[] = [];

    Object.entries(exerciseDatabase).forEach(([bodyPart, exercises]) => {
      if (inputLower.includes(bodyPart) || exercises.some(ex => ex.toLowerCase().includes(inputLower))) {
        suggestions.push(...exercises);
      }
    });

    if (inputLower.includes('push')) {
      suggestions.push('Push-ups', 'Push Press', 'Chest Press');
    }
    if (inputLower.includes('pull')) {
      suggestions.push('Pull-ups', 'Cable Pulls', 'Face Pulls');
    }
    if (inputLower.includes('squat')) {
      suggestions.push('Squats', 'Goblet Squats', 'Jump Squats');
    }

    return [...new Set(suggestions)].slice(0, 5);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentExercise({ ...currentExercise, name: suggestion });
    setAiSuggestions([]);
  };

  const handleSaveWorkout = async () => {
    if (!title.trim() || exercises.length === 0) {
      alert('Please add a title and at least one exercise');
      return;
    }

    setSaving(true);
    try {
      // Update workout title
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({ title: title.trim() })
        .eq('id', workout!.id);

      if (workoutError) throw workoutError;

      // Delete all existing exercises
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('workout_id', workout!.id);

      if (deleteError) throw deleteError;

      // Insert updated exercises
      const exerciseInserts = exercises.map(exercise => ({
        workout_id: workout!.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exerciseInserts);

      if (exercisesError) throw exercisesError;

      navigate('/workouts');
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error saving workout. Please try again.');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold text-white">Edit Workout</h1>
          <p className="text-gray-400">Modify your workout session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Workout Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Workout Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Upper Body Strength"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="text-lg font-medium text-white mb-4">Add Exercise</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Exercise Name
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={currentExercise.name}
                      onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                      placeholder="e.g., Push-ups, chest, bicep"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleGetSuggestions}
                      disabled={loadingSuggestions || !currentExercise.name.trim()}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                    >
                      {loadingSuggestions ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {aiSuggestions.length > 0 && (
                    <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">AI Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sets
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentExercise.sets}
                      onChange={(e) => setCurrentExercise({ ...currentExercise, sets: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reps
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentExercise.reps}
                      onChange={(e) => setCurrentExercise({ ...currentExercise, reps: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={currentExercise.weight || ''}
                      onChange={(e) => setCurrentExercise({ ...currentExercise, weight: parseFloat(e.target.value) || null })}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddExercise}
                  disabled={!currentExercise.name.trim()}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 inline mr-2" />
                  Add Exercise
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Exercises ({exercises.length})
          </h2>
          
          {exercises.length > 0 ? (
            <div className="space-y-3 mb-6">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-white">{exercise.name}</h3>
                    <p className="text-sm text-gray-400">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight && ` @ ${exercise.weight}lbs`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(index)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 mb-6">
              <p>No exercises added yet.</p>
              <p className="text-sm mt-1">Add exercises to build your workout.</p>
            </div>
          )}

          <button
            onClick={handleSaveWorkout}
            disabled={saving || !title.trim() || exercises.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
          >
            <Save className="h-5 w-5 inline mr-2" />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}