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
      <p style={{ margin: 0, padding: "0.6em 1em", background: "#05060a" }}>
        <a
          href="/"
          // v2 understands v1's ?temp= parameter, so the visitor keeps their temperature.
          onClick={(e) => (e.currentTarget.href = "/" + window.location.search)}
          style={{ color: "#ffc58a" }}
        >
          This is the original version. Try the new one →
        </a>
      </p>
      <BlackbodyRadiation
        temp={temp}
        max={appDefaults.maximumTemperature}
        min={appDefaults.minimumTemperature}
        step={appDefaults.temperatureStepAmount}
      />
    </div>
  );
}
