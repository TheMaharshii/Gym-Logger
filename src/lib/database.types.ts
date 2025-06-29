export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed_at: string | null;
          duration: number | null;
          is_routine: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          completed_at?: string | null;
          duration?: number | null;
          is_routine?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          completed_at?: string | null;
          duration?: number | null;
          is_routine?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          name: string;
          sets: number;
          reps: number;
          weight: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          name: string;
          sets: number;
          reps: number;
          weight?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          name?: string;
          sets?: number;
          reps?: number;
          weight?: number | null;
          created_at?: string;
        };
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          consumed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          consumed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          calories?: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          consumed_at?: string;
          created_at?: string;
        };
      };
    };
  };
}