import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const StockChart = ({ data }) => {
  // Format data for chart
  const chartData = data?.map(item => ({
    name: item.name,
    stock: item.current_stock,
    min: item.min_stock,
    status: item.current_stock < (item.min_stock * 0.3) ? 'danger' : 
            item.current_stock < item.min_stock ? 'warning' : 'success'
  })) || [];

  const getColor = (status) => {
    switch(status) {
      case 'danger': return '#dc2626'; // red-600
      case 'warning': return '#f59e0b'; // amber-500
      case 'success': return '#16a34a'; // green-600
      default: return '#16a34a';
    }
  };

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée disponible</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
        <Tooltip 
          formatter={(value, name, props) => [
            value, 
            `Stock (Min: ${props.payload.min})`
          ]}
        />
        <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StockChart;
