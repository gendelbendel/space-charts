import "./App.css";
import BlackbodyRadiation from "./components/BlackbodyRadiation";
import getQueryStringParam from "./utils/querystring";
import constants from "./utils/constants";

export default function App() {
  let temp = getQueryStringParam("temp") || constants.defaultTemperature; // get temp param, or use the default

  if (temp > constants.maximumTemperature) temp = constants.maximumTemperature;
  if (temp < constants.minimumTemperature) temp = constants.minimumTemperature;

  return (
    <div className="App">
      <BlackbodyRadiation
        temp={temp}
        max={constants.maximumTemperature}
        min={constants.minimumTemperature}
        step={constants.temperatureStepAmount}
      />
    </div>
  );
}
