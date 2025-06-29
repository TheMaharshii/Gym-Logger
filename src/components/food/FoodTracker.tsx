import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Search, X, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  consumed_at: string;
}

interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function FoodTracker() {
  const { user } = useAuth();
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (user) {
      fetchFoodEntries();
    }
  }, [user, selectedDate]);

  const fetchFoodEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user!.id)
        .gte('consumed_at', selectedDate)
        .lt('consumed_at', format(new Date(new Date(selectedDate).getTime() + 86400000), 'yyyy-MM-dd'))
        .order('consumed_at', { ascending: false });

      if (error) throw error;
      setFoodEntries(data || []);
    } catch (error) {
      console.error('Error fetching food entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchFood = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Mock food search - in a real app, you'd use a food API like Edamam or CalorieNinjas
      const mockResults = getMockFoodResults(searchQuery);
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching food:', error);
    } finally {
      setSearching(false);
    }
  };

  const getMockFoodResults = (query: string): FoodSearchResult[] => {
    const foodDatabase = {
      apple: { name: 'Apple (medium)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      banana: { name: 'Banana (medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      chicken: { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      rice: { name: 'White Rice (1 cup cooked)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
      broccoli: { name: 'Broccoli (1 cup)', calories: 25, protein: 3, carbs: 5, fat: 0.3 },
      egg: { name: 'Egg (large)', calories: 70, protein: 6, carbs: 0.6, fat: 5 },
      salmon: { name: 'Salmon (100g)', calories: 208, protein: 22, carbs: 0, fat: 13 },
      oatmeal: { name: 'Oatmeal (1 cup cooked)', calories: 154, protein: 6, carbs: 28, fat: 3 },
      avocado: { name: 'Avocado (half)', calories: 160, protein: 2, carbs: 9, fat: 15 },
      yogurt: { name: 'Greek Yogurt (1 cup)', calories: 130, protein: 23, carbs: 9, fat: 0 },
    };

    const queryLower = query.toLowerCase();
    const results: FoodSearchResult[] = [];

    Object.entries(foodDatabase).forEach(([key, food]) => {
      if (key.includes(queryLower) || food.name.toLowerCase().includes(queryLower)) {
        results.push(food);
      }
    });

    // Add some generic results if no specific matches
    if (results.length === 0) {
      results.push(
        { name: `${query} (estimated)`, calories: 150, protein: 5, carbs: 20, fat: 6 }
      );
    }

    return results.slice(0, 5);
  };

  const addFoodEntry = async (food: FoodSearchResult) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .insert({
          user_id: user!.id,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          consumed_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSearchQuery('');
      setSearchResults([]);
      fetchFoodEntries();
    } catch (error) {
      console.error('Error adding food entry:', error);
      alert('Error adding food entry. Please try again.');
    }
  };

  const removeFoodEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchFoodEntries();
    } catch (error) {
      console.error('Error removing food entry:', error);
    }
  };

  const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = foodEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
  const totalFat = foodEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0);

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
        <h1 className="text-3xl font-bold text-white mb-2">Food Tracker</h1>
        <p className="text-gray-400">Track your daily nutrition and calories</p>
      </div>

      {/* Date Selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Calories</p>
              <p className="text-xl font-bold text-white">{totalCalories}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-400">Protein</p>
            <p className="text-xl font-bold text-white">{Math.round(totalProtein)}g</p>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-400">Carbs</p>
            <p className="text-xl font-bold text-white">{Math.round(totalCarbs)}g</p>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-400">Fat</p>
            <p className="text-xl font-bold text-white">{Math.round(totalFat)}g</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Add Food</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                placeholder="Search for food (e.g., apple, chicken, rice)"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={searchFood}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                {searching ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">Search Results:</h3>
                {searchResults.map((food, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white">{food.name}</p>
                      <p className="text-sm text-gray-400">
                        {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() => addFoodEntry(food)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Food Entries */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Today's Food ({foodEntries.length} items)
          </h2>
          
          {foodEntries.length > 0 ? (
            <div className="space-y-3">
              {foodEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white">{entry.name}</p>
                    <p className="text-sm text-gray-400">
                      {entry.calories} calories
                      {entry.protein && ` • ${Math.round(entry.protein)}g protein`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFoodEntry(entry.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No food entries for this date.</p>
              <p className="text-sm mt-1">Search and add foods to track your nutrition.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}