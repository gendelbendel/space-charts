import { Box } from "@mui/system";
import Typography from "@mui/material/Typography";

import { normalizeSpectralIntensityRGB } from "../utils/space-colors";

interface StarProps {
  temperature: number;
  className?: string;
}

export default function Star({ temperature, className }: StarProps) {
  return (
    <Box
      className={className}
      sx={{ maxWidth: 250, justifyContent: "center", alignItems: "center" }}
    >
      <Typography id="input-slider" gutterBottom>
        Star's color
      </Typography>
      <svg height="100" width="100">
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="black"
          strokeWidth="0.5"
          fill={normalizeSpectralIntensityRGB(temperature)}
        />
      </svg>
    </Box>
  );
}
