import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import { useState } from "react";
import LineChart from "./components/LineChart";
import { calculateTabulatedCurve } from "./utils/planck";
import "./App.css";

Chart.register(CategoryScale);

export default function App() {
  const temperature = 5000; // K
  const minWavelength = 0; // nm
  const maxWavelength = 2000; // nm
  const step = 40; // nm
  const [wavelengths, spectralRadianceValues] = calculateTabulatedCurve(
    temperature,
    minWavelength,
    maxWavelength,
    step
  );

  const [chartData, setChartData] = useState({
    labels: wavelengths,
    datasets: [
      {
        label: "Spectral Radiance",
        data: spectralRadianceValues,
        backgroundColor: ["rgba(75,192,192,1)"],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });

  return (
    <div className="App">
      <p>Using Chart.js in React</p>
      <LineChart chartData={chartData} />
    </div>
  );
}
