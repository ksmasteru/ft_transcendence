import React from 'react';
import { Search, Settings, Bell, ChevronDown, LayoutDashboard, Shield, Calendar, Award, Medal, Activity, Star, Trophy } from 'lucide-react';

interface MedalCardProps {
  type: 'Gold' | 'Silver' | 'Bronze';
  count: number;
}

export const MedalCard = ({ type, count }) => {
  const getIcon = () => {
    switch (type) {
      case 'Gold': return <Trophy className="text-yellow-400" size={32} />;
      case 'Silver': return <Medal className="text-gray-300" size={32} />;
      case 'Bronze': return <Award className="text-amber-600" size={32} />;
      default: return <Trophy className="text-gray-400" size={32} />;
    }
  };

  const getBgGradient = () => {
    switch (type) {
      case 'Gold': return 'from-yellow-500/20 to-yellow-600/10';
      case 'Silver': return 'from-gray-300/20 to-gray-400/10';
      case 'Bronze': return 'from-amber-600/20 to-amber-700/10';
      default: return 'from-gray-500/20 to-gray-600/10';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getBgGradient()} p-6 rounded-lg border border-gray-700/30 text-center`}>
      <div className="flex justify-center mb-4">{getIcon()}</div>
      <h3 className="text-lg font-semibold text-white mb-1">{type} Medals</h3>
      <p className="text-3xl font-bold text-teal-400">{count}</p>
    </div>
  );
};