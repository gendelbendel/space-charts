// App.js
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import { useState } from "react";
import { Data } from "./utils/Data";
import PieChart from "./components/PieChart";
import { BarChart } from "./components/BarChart";
import LineChart from "./components/LineChart";
import calculateTabulatedCurve from "./utils/planck";
import "./App.css";

Chart.register(CategoryScale);

export default function App() {
  const temperature = 5000; // K
  const minWavelength = 0; // nm
  const maxWavelength = 2000; // nm
  const step = 10; // nm
  const [wavelengths, spectralRadianceValues] = calculateTabulatedCurve(
    temperature,
    minWavelength,
    maxWavelength,
    step
  );

  const [chartData, setChartData] = useState({
    labels: wavelengths, //Data.map((data) => data.year),
    datasets: [
      {
        label: "Users Gained ",
        data: spectralRadianceValues, //Data.map((data) => data.userGain),
        backgroundColor: [
          "rgba(75,192,192,1)",
          // "#ecf0f1",
          // "#50AF95",
          // "#f3ba2f",
          // "#2a71d0",
        ],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });

  return (
    <div className="App">
      <p>Using Chart.js in React</p>
      <PieChart chartData={chartData} />
      <BarChart chartData={chartData} />
      <LineChart chartData={chartData} />
    </div>
  );
}
