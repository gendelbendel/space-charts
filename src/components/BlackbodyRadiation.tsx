import { useState, useEffect } from "react";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import { Container, Box } from "@mui/system";
import Grid from "@mui/material/Grid";
import { ChartData, ChartOptions } from "chart.js";

import InputSlider from "./InputSlider";
import LineChart from "./LineChart";
import Star from "./Star";
import About from "./About";

import { calculateTabulatedCurve } from "../utils/chart-data";
import {
  wavelengthToRGBA,
  normalizeSpectralIntensityRGB,
} from "../utils/space-colors";

Chart.register(CategoryScale);

interface BlackbodyRadiationProps {
  temp: number;
  max: number;
  min: number;
  step: number;
}

export default function BlackbodyRadiation({
  temp,
  max,
  min,
  step,
}: BlackbodyRadiationProps) {
  const [temperature, setTemperature] = useState(temp);

  const options: ChartOptions<"line"> = {
    plugins: {
      title: {
        display: true,
        text: `Spectral Radiance of a Star @ ${temperature} degrees Kelvin`,
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (val: { formattedValue: string }) =>
            `Spectral radiance: ${parseFloat(
              val.formattedValue.replace(/,/g, "")
            ).toExponential(4)}`,
        },
      },
    },
    elements: {
      line: {
        tension: 0.5,
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val: string | number) => {
            if (typeof val === "number") return val.toExponential(4);
            return val;
          },
        },
        title: {
          display: true,
          text: "Spectral Radiance (W/m^2/sr/m)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Wavelength (nm)",
        },
      },
    },
  };

  const getData = (): ChartData<"line"> => {
    const minWavelength = 0; // nm
    const maxWavelength = 1000; // nm
    const step = 10; // nm
    const [wavelengths, spectralRadianceValues] = calculateTabulatedCurve(
      temperature,
      minWavelength,
      maxWavelength,
      step
    );

    return {
      labels: wavelengths,
      datasets: [
        {
          label: "Spectral Radiance",
          data: spectralRadianceValues,
          backgroundColor: ["rgba(75,192,192,1)"],
          borderColor: "black",
          borderWidth: 1,
          pointBorderWidth: 0.4,
          pointBackgroundColor: (context: { dataIndex: number }) =>
            wavelengthToRGBA(wavelengths[context.dataIndex]),
        },
      ],
    };
  };
  const [chartData, setChartData] = useState(getData);

  useEffect(() => {
    setChartData(getData());
    normalizeSpectralIntensityRGB(temperature);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temperature]);

  return (
    <Container className="blackbody" maxWidth="lg">
      <Box
        sx={{
          bgcolor: "#cfe8fc",
          paddingTop: "0.5em",
          paddingBottom: "0.5em",
        }}
      >
        <h1>Blackbody Radiation interactive</h1>
        <Grid
          container
          // className="temperature"
          sx={{ justifyContent: "center", alignItems: "center" }}
          spacing={2}
        >
          <Grid item xs={5}>
            <InputSlider
              className="temperature"
              defaultValue={temperature}
              updateFunc={setTemperature}
              description="Temperature (K)"
              min={min}
              max={max}
              step={step}
            />
          </Grid>
          <Grid item xs={5}>
            <Star className="star" temperature={temperature} />
          </Grid>
        </Grid>

        <LineChart chartData={chartData} options={options} />
        <About />
      </Box>
    </Container>
  );
}
