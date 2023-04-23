import React, { Dispatch, SetStateAction } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

const Input = styled(MuiInput)`
  width: 60px;
`;

interface InputSliderProps {
  defaultValue: number;
  description: string;
  min: number;
  max: number;
  step: number;
  updateFunc: Dispatch<SetStateAction<number>>;
  className?: string;
}

export default function InputSlider({
  defaultValue,
  description,
  min,
  max,
  step,
  updateFunc,
  className,
}: InputSliderProps) {
  const [value, setValue] = React.useState(defaultValue);

  const setBoth = (newValue: number) => {
    setValue(newValue);
    updateFunc(newValue);
    window.history.replaceState(null, "", "?temp=" + newValue);
  };
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") setBoth(newValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === "" ? 0 : Number(event.target.value);
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
      sx={{ maxWidth: 450, justifyContent: "center", alignItems: "center" }}
    >
      <Typography id="input-slider" gutterBottom>
        {description}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            value={value}
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
