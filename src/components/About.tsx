import { Container, Box } from "@mui/system";
import Stars from "./Stars";
import Link from "./Link";
import FAQItem from "./FAQItem";

import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { physics } from "../utils/constants";
import { numberToScientificNotationLatex } from "../utils/math";

export default function About() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ bgcolor: "#cfe8fc", paddingTop: "0.5em" }}>
        <FAQItem title="What's going on here?">
          <p>
            Given a temperature in Kelvin, this tool is determining the{" "}
            <Link href="https://en.wikipedia.org/wiki/Spectral_radiance">
              Spectral radiance
            </Link>{" "}
            of a black body entity given it's temperature.
          </p>
        </FAQItem>
        <FAQItem title="How to use this">
          <p>
            As you use the slider or input box to modify the temperature, the
            spectral radiance chart will update in real time, as will the star's
            color.
          </p>
        </FAQItem>
        <FAQItem title="What are the nodes? Why are some colored and others not?">
          <p>
            Each node represents the spectral radiance of the black body entity
            for each individual wavelength on the{" "}
            <Link href="https://en.wikipedia.org/wiki/Electromagnetic_radiation#Electromagnetic_spectrum">
              electromagnetic spectrum.
            </Link>
          </p>
          <p>
            There are a number of nodes on this chart, but some are colored
            while some are transparent. The colored nodes represent a wavelength
            that has an associated color that we humans can see, on the{" "}
            <Link href="https://www.thoughtco.com/the-visible-light-spectrum-2699036">
              visible spectrum.
            </Link>
            .
          </p>
        </FAQItem>
        <FAQItem title="Wait... stars can't be green?">
          <p>Nope! At least not to the human eye.</p>
          <p>
            There are situations in which a star appears green, the most common
            example of this is the{" "}
            <Link href="https://en.wikipedia.org/wiki/Green_flash">
              green flash
            </Link>{" "}
            effect, which is when refraction caused by Earth's atmosphere causes
            the Sun's light to appear green. But the star itself is still the
            same color, and not green.
          </p>
        </FAQItem>
        <FAQItem title="How does it work?">
          <p>
            I'm using{" "}
            <Link href="https://en.wikipedia.org/wiki/Planck%27s_law#The_law">
              Planck's Law
            </Link>{" "}
            to determine this. (
            <Link href="https://github.com/gendelbendel/space-charts/blob/main/src/utils/math.ts#L3">
              Here's
            </Link>{" "}
            my code for that. If you find any problems with that, please let me
            know!)
          </p>
        </FAQItem>
        <FAQItem title="What is Planck's law?">
          <p>
            Planck's Law LaTeX:{" "}
            <BlockMath
              math={
                "B_\\lambda(T) = \\frac{2hc^2}{\\lambda^5} \\frac{1}{e^{hc/(\\lambda k_B T)} - 1}"
              }
            />
          </p>
          <p>
            Where:
            <p>
              <InlineMath math={"B_\\lambda(T)"} /> is the spectral radiance of
              a wavelength in meters (<InlineMath math={"\\lambda"} />) given a
              temperature in Kelvin (<InlineMath math={"T"} />
              ), in terms of watts per square meter per steradian per meter of
              wavelength (W/m^2/sr/m)
            </p>
            <p>
              <InlineMath math={"h"} /> is Planck's constant, in terms of Joule
              seconds, which is{" "}
              <InlineMath
                math={`${numberToScientificNotationLatex(physics.h)}`}
              />
            </p>
            <p>
              <InlineMath math={"c"} /> is the speed of light in a vacuum, in
              terms of meters per second, which is{" "}
              <InlineMath
                math={`${numberToScientificNotationLatex(physics.c)}`}
              />
            </p>
            <p>
              <InlineMath math={"k_B"} /> is the Boltzmann constant, in terms of
              Joules per Kelvin, which is{" "}
              <InlineMath
                math={`${numberToScientificNotationLatex(physics.k)}`}
              />
            </p>
          </p>
        </FAQItem>
        <FAQItem title="Spectral radiance is in terms of... what?">
          <p>
            The unit "spectral radiance" is a measure of the power per unit area
            per unit solid angle per unit wavelength interval emitted from a
            surface or received by a detector. It is expressed in watts per
            square meter per steradian per meter of wavelength (W/m^2/sr/m)
          </p>
          <p>
            Watts (W) represents the unit of power, which is the rate at which
            energy is transferred.{" "}
          </p>
          <p>
            Square meters (m^2) represents the unit of area over which the
            energy is spread.
          </p>
          <p>
            {" "}
            Steradian (sr) represents the unit of solid angle, which is a
            measure of the amount of the sky that is covered.
          </p>
          <p>
            {" "}
            Meters (m) represents the unit of wavelength, which is the distance
            between two consecutive peaks or troughs of a wave.
          </p>
        </FAQItem>
        <FAQItem title="How are you getting the color of the star?">
          <p>
            To get the color of the star, I am integrating the spectral radiance
            over three wavelength ranges: a red range (620 - 680 nm), a green
            range (500 - 550 nm), and a blue range (430 - 480 nm). Once each
            values are normalized, an RGB color can be determined.
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
            of the spectral radiance for these stars are in the infrared range,
            which isn't visible to the human eye. They would barely glow a deep
            red, but would likely just appear black to our eyes.
          </p>
        </FAQItem>

        <FAQItem title="Popular stars to test">
          <Stars />
        </FAQItem>
        <FAQItem title="Libraries">
          <p>
            I'm using{" "}
            <Link href="https://react-chartjs-2.js.org/">react-chartjs-2</Link>{" "}
            for charting.
          </p>
          <p>
            I'm using <Link href="https://mui.com/">Material UI (MUI)</Link> for
            the slider and some containers.
          </p>
          <p>
            I'm using{" "}
            <Link href="https://github.com/talyssonoc/react-katex/tree/master/packages/react-katex">
              react-katex
            </Link>{" "}
            for the rendering LaTeX equations.
          </p>
        </FAQItem>
        <FAQItem title="About me">
          <p>
            I'm David, a software engineer that dabbles in astronomy, and other
            things.
          </p>
          <p>
            Find this project on{" "}
            <Link href="https://github.com/gendelbendel/space-charts">
              Github.
            </Link>
          </p>
        </FAQItem>
        <FAQItem title="Todos">
          <p>1. Add routing from clicking a Kelvin value in the table</p>
          <p>2. Gamma correction</p>
        </FAQItem>
      </Box>
    </Container>
  );
}
