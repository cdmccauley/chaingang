import { Grid, Button, Paper, Typography } from "@mui/material";

export default function Disconnected({ config, connect, connecting, signOut }) {
  return (
    <Paper
      elevation={3}
      sx={{ p: 2, maxWidth: "256px", backgroundColor: "#4b0082" }}
    >
      <Grid item xs={12} container justifyContent="center">
        <Typography align="center" paragraph>
          {config.connect}
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => (!connecting ? connect() : console.log("CONNECTING"))}
        >
          {!connecting ? "Connect Wallet" : "Connecting..."}
        </Button>
        <Button
          sx={{ mt: 1.5 }}
          variant="outlined"
          color="secondary"
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
      </Grid>
    </Paper>
  );
}
