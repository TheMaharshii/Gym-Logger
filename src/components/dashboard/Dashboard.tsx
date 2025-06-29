import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Flame, Dumbbell, TrendingUp } from 'lucide-react';
import { format, isToday, parseISO, differenceInDays } from 'date-fns';

interface DashboardStats {
  currentStreak: number;
  totalWorkouts: number;
  totalCalories: number;
  recentWorkouts: Array<{
    id: string;
    title: string;
    completed_at: string;
    duration: number;
  }>;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    currentStreak: 0,
    totalWorkouts: 0,
    totalCalories: 0,
    recentWorkouts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch completed workouts
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      // Calculate streak
      const streak = calculateStreak(workouts || []);

      // Get recent workouts
      const recentWorkouts = (workouts || []).slice(0, 5);

      // Fetch today's calories
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: foodEntries } = await supabase
        .from('food_entries')
        .select('calories')
        .eq('user_id', user!.id)
        .gte('consumed_at', today)
        .lt('consumed_at', format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));

      const totalCalories = foodEntries?.reduce((sum, entry) => sum + entry.calories, 0) || 0;

      setStats({
        currentStreak: streak,
        totalWorkouts: workouts?.length || 0,
        totalCalories,
        recentWorkouts,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (workouts: any[]) => {
    if (!workouts.length) return 0;

    const today = new Date();
    const workoutDates = workouts
      .map(w => format(parseISO(w.completed_at), 'yyyy-MM-dd'))
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = format(today, 'yyyy-MM-dd');

    for (const workoutDate of workoutDates) {
      const daysDiff = differenceInDays(new Date(currentDate), new Date(workoutDate));
      
      if (daysDiff === 0) {
        streak++;
        currentDate = format(new Date(new Date(currentDate).getTime() - 86400000), 'yyyy-MM-dd');
      } else if (daysDiff === 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }

    return streak;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your fitness overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Workouts</p>
              <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Today's Calories</p>
              <p className="text-2xl font-bold text-white">{stats.totalCalories}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-white">
                {stats.recentWorkouts.filter(w => 
                  differenceInDays(new Date(), parseISO(w.completed_at)) < 7
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Workouts</h2>
        {stats.recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {stats.recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-white">{workout.title}</h3>
                  <p className="text-sm text-gray-400">
                    {format(parseISO(workout.completed_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-400">
                    {formatDuration(workout.duration)}
                  </p>
                  <p className="text-xs text-gray-400">duration</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No workouts completed yet.</p>
            <p className="text-sm text-gray-500 mt-1">Start your first workout to see it here!</p>
          </div>
        )}
      </div>
    </div>
  );
}