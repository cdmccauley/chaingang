import { Grid, Paper, Typography, CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <Paper
      elevation={3}
      sx={{ p: 2, maxWidth: "256px", backgroundColor: "#4b0082" }}
    >
      <Grid container justifyContent="center">
        <Grid item container justifyContent="center" sx={{ mt: 2 }}>
          <CircularProgress thickness={5} color="secondary" />
        </Grid>

        <Grid item container justifyContent="center" sx={{ mt: 2 }}>
          <Typography align="center" paragraph>
            Loading...
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
