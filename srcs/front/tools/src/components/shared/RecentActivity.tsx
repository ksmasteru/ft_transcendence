import React from 'react';
import { Search, Settings, Bell, ChevronDown, LayoutDashboard, Shield, Calendar, Award, Medal, Activity, Star, Trophy } from 'lucide-react';

interface Activity {
  id: string;
  text: string;
  createdAt: string;
  icon?: React.ReactNode;
}

interface RecentActivityProps {
  activities?: Activity[];
}

export const RecentActivity = ({ activities = [] }) => {
  const defaultActivities = [
    { id: 1, action: 'Scored a smashing point 🏓', timestamp: '2 hours ago', type: 'achievement' },
    { id: 2, action: 'Finished a match with victory 🏆', timestamp: '1 day ago', type: 'medal' },
    { id: 3, action: 'Won a rally 🔥', timestamp: '3 days ago', type: 'level' },
  ];

  const activityList = activities.length > 0 ? activities : defaultActivities;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'achievement': return <Award size={16} className="text-teal-400" />;
      case 'medal': return <Medal size={16} className="text-yellow-400" />;
      case 'level': return <Star size={16} className="text-blue-400" />;
      default: return <Activity size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Activity size={24} />
        Recent Activity
      </h2>
      <div className="bg-[#2c3138]/50 rounded-lg border border-gray-700/30 overflow-hidden">
        {activityList.length > 0 ? (
          <div className="divide-y divide-gray-700/30">
            {activityList.map((activity, index) => (
              <div key={activity.id || index} className="p-4 hover:bg-gray-700/20 transition-colors">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-white">{activity.action}</p>
                    <p className="text-sm text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            No recent activity to display
          </div>
        )}
      </div>
    </div>
  );
};