import { Container, Box } from "@mui/system";
import Stars from "./Stars";

import { constants, planck } from "../utils/planck";

export default function About() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ bgcolor: "#cfe8fc", "padding-top": "0.5em" }}>
        <div>
          <h1>What's going on here?</h1>
          <p>
            Given a temperature in Kelvin, this tool is determining the{" "}
            <a href="https://en.wikipedia.org/wiki/Spectral_density">
              Spectral density
            </a>{" "}
            of a black body entity given it's temperature.
          </p>
          <p>
            I'm using{" "}
            <a href="https://en.wikipedia.org/wiki/Planck%27s_law#The_law">
              Planck's Law
            </a>{" "}
            to determine this. (
            <a href="https://github.com/gendelbendel/space-charts/blob/main/src/utils/planck.js#L7">
              Here's
            </a>{" "}
            my code for that. If you find any problems with that, please let me
            know!)
          </p>
        </div>
        <div>
          <h2>How to use this</h2>
          <p>
            As you use the slider or input box to modify the temperature, the
            spectral density chart will update in real time.
          </p>
        </div>
        <div>
          <h2>What are the nodes? Why are some colored and others not?</h2>
          <p>
            Each node represents the spectral density of the black body entity
            for each individual wavelength on the{" "}
            <a href="https://en.wikipedia.org/wiki/Electromagnetic_radiation#Electromagnetic_spectrum">
              electromagnetic spectrum.
            </a>
          </p>
          <p>
            There are a number of nodes on this chart, but some are colored
            while some are transparent. The colored nodes represent a wavelength
            that has an associated color that we humans can see, on the{" "}
            <a href="https://www.thoughtco.com/the-visible-light-spectrum-2699036">
              visible spectrum.
            </a>
            .
          </p>
        </div>
        <div>
          <h2>Popular stars to test</h2>
          <Stars />
        </div>
        <div>
          <h2>Libraries</h2>
          <p>
            I'm using{" "}
            <a href="https://react-chartjs-2.js.org/">react-chartjs-2</a> for
            charting.
          </p>
          <p>
            I'm using <a href="https://mui.com/">Material UI (MUI)</a> for the
            slider and some containers.
          </p>
        </div>
        <div>
          <h2>About me</h2>
          <p>
            I'm David, a software engineer that dabbles in astronomy, and other
            things.
          </p>
          <p>
            Find this project on{" "}
            <a href="https://github.com/gendelbendel/space-charts">Github.</a>
          </p>
        </div>
        <div>
          <h2>Todos</h2>
          <p>
            1. Display the actual color of the star based on the information
            plotted.
          </p>
        </div>
      </Box>
    </Container>
  );
}
