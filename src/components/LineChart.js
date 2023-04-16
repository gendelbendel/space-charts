import React from "react";
import { Line } from "react-chartjs-2";
function LineChart({ chartData }) {
  return (
    <div className="chart-container">
      {/* <h2 style={{ textAlign: "center" }}>Blackbody Radiation</h2> */}
      <Line
        data={chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: "Spectral Radiance of a Star @ 5000 degrees Kelvin",
            },
            legend: {
              display: false,
            },
            decimation: {
              enabled: true,
              algorithm: "lttb",
              samples: 40,
            },
            tooltip: {
              callbacks: {
                label: (val) =>
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
                callback: (val) => val.toExponential(),
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
        }}
      />
    </div>
  );
}
export default LineChart;
