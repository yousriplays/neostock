import React from 'react';

const KPICard = ({ icon, title, value, subtitle, color = 'primary' }) => {
  const colorMap = {
    primary: 'text-primary bg-primary-light border-primary-light',
    danger: 'text-danger bg-red-50 border-red-100',
    warning: 'text-warning bg-amber-50 border-amber-100',
    success: 'text-success bg-green-50 border-green-100',
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-lg ${selectedColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;
