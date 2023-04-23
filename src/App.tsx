import "./App.css";
import BlackbodyRadiation from "./components/BlackbodyRadiation";
import getQueryStringParam from "./utils/querystring";
import { appDefaults } from "./utils/constants";

export default function App() {
  const qspTemp = getQueryStringParam("temp");
  let temp = qspTemp ? parseInt(qspTemp) : appDefaults.defaultTemperature; // get temp param, or use the default

  if (temp > appDefaults.maximumTemperature)
    temp = appDefaults.maximumTemperature;
  if (temp < appDefaults.minimumTemperature)
    temp = appDefaults.minimumTemperature;

  return (
    <div className="App">
      <BlackbodyRadiation
        temp={temp}
        max={appDefaults.maximumTemperature}
        min={appDefaults.minimumTemperature}
        step={appDefaults.temperatureStepAmount}
      />
    </div>
  );
}
