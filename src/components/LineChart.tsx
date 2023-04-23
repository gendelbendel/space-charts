import React from "react";
import { Line } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";

interface LineChartProps {
  height?: number;
  chartData: ChartData<"line">;
  options?: ChartOptions<"line">;
}

function LineChart({ height, chartData, options }: LineChartProps) {
  return (
    <div className="chart-container">
      <Line height={height} data={chartData} options={options} />
    </div>
  );
}
export default LineChart;
