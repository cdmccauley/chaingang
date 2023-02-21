import { Typography } from "@mui/material";

export default function Verified({ config }) {
  return (
    <Typography align="center" paragraph>
      {config?.verified}
    </Typography>
  );
}
