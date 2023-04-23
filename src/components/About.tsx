import { Container, Box } from "@mui/system";
import Stars from "./Stars";

export default function About() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ bgcolor: "#cfe8fc", paddingTop: "0.5em" }}>
        <div>
          <h1>What's going on here?</h1>
          <p>
            Given a temperature in Kelvin, this tool is determining the{" "}
            <a href="https://en.wikipedia.org/wiki/Spectral_density">
              Spectral density
            </a>{" "}
            of a black body entity given it's temperature.
          </p>
        </div>
        <div>
          <h2>How to use this</h2>
          <p>
            As you use the slider or input box to modify the temperature, the
            spectral density chart will update in real time, as will the star's
            color.
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
          <h2>Wait... stars can't be green?</h2>
          <p>Nope! At least not to the human eye.</p>
          <p>
            There are situations in which a star appears green, the most common
            example of this is the{" "}
            <a href="https://en.wikipedia.org/wiki/Green_flash">green flash</a>{" "}
            effect, which is when refraction caused by Earth's atmosphere causes
            the Sun's light to appear green. But the star itself is still the
            same color, and not green.
          </p>
        </div>
        <div>
          <h2>How does it work?</h2>
          <p>
            I'm using{" "}
            <a href="https://en.wikipedia.org/wiki/Planck%27s_law#The_law">
              Planck's Law
            </a>{" "}
            to determine this. (
            <a href="https://github.com/gendelbendel/space-charts/blob/main/src/utils/math.ts#L3">
              Here's
            </a>{" "}
            my code for that. If you find any problems with that, please let me
            know!)
          </p>
          <p>
            Then to get the color of the star, I am integrating the spectral
            density over three wavelength ranges: a red range (620 - 680 nm), a
            green range (500 - 550 nm), and a blue range (430 - 480 nm). Once
            each values are normalized, an RGB color can be determined.
          </p>
          <p>
            Note: This is not quite the same method that astronomers use to
            calculate color (calculating the magnitude of the B-V filters to get
            a color index, then using a lookup table), but is close enough for
            hobbyist usages.
          </p>
          <p>
            Additional note: Stars on the extreme low end of temperatures (below
            1500 K) are much darker and less vibrant than this tool shows. Most
            of the spectral density for these stars are in the infrared range,
            which isn't visible to the human eye. They would barely glow a deep
            red, but would likely just appear black to our eyes.
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
          <p>1. Add routing from clicking a Kelvin value in the table</p>
          <p>2. Gamma correction</p>
        </div>
      </Box>
    </Container>
  );
}
