import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

const Input = styled(MuiInput)`
  width: 70px;
`;

export default function InputSlider({
  defaultValue,
  description,
  min,
  max,
  step,
  updateFunc = () => {},
  className,
}) {
  const [value, setValue] = React.useState(defaultValue);

  const setBoth = (newValue) => {
    setValue(newValue);
    updateFunc(newValue);
  };
  const handleSliderChange = (event, newValue) => {
    setBoth(newValue);
  };

  const handleInputChange = (event) => {
    const newValue =
      event.target.value === "" ? "" : Number(event.target.value);
    setBoth(newValue);
  };

  const handleBlur = () => {
    if (value < min) {
      setBoth(min);
    } else if (value > max) {
      setBoth(max);
    }
  };

  return (
    <Box
      className={className}
      sx={{ maxWidth: 250, justifyContent: "center", alignItems: "center" }}
    >
      <Typography id="input-slider" gutterBottom>
        {description}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            value={typeof value === "number" ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            step={step}
            min={min}
            max={max}
          />
        </Grid>
        <Grid item>
          <Input
            value={value}
            size="small"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: step,
              min: min,
              max: max,
              type: "number",
              "aria-labelledby": "input-slider",
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
