import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChangePassword } from '../auth/ChangePassword';
import { User } from 'lucide-react';

export function ProfileSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* User Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Account Information</h2>
            <p className="text-gray-400">Your account details</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <p className="text-white bg-gray-800 px-3 py-2 rounded-lg">
              {user?.email}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              User ID
            </label>
            <p className="text-gray-400 bg-gray-800 px-3 py-2 rounded-lg font-mono text-sm">
              {user?.id}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <ChangePassword />
    </div>
  );
}