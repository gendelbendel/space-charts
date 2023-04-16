import React from "react";
import { Line } from "react-chartjs-2";

function LineChart({ chartData, options }) {
  return (
    <div className="chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
}
export default LineChart;
