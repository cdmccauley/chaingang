import { Grid, Button, Paper, Typography } from "@mui/material";

export default function SignedOut({ config }) {
  const popupCenter = (url, title) => {
    const dualScreenLeft = window.screenLeft ?? window.screenX;
    const dualScreenTop = window.screenTop ?? window.screenY;

    const width =
      window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;

    const height =
      window.innerHeight ??
      document.documentElement.clientHeight ??
      screen.height;

    const systemZoom = width / window.screen.availWidth;

    const left = (width - 500) / 2 / systemZoom + dualScreenLeft;
    const top = (height - 650) / 2 / systemZoom + dualScreenTop;

    const newWindow = window.open(
      url,
      title,
      `location=0,toolbar=0,width=450,height=650,top=${top},left=${left}`
    );

    newWindow?.focus();
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, maxWidth: "256px" }}
    >
      <Grid item xs={12} container justifyContent="center">
        <Typography align="center" paragraph>
          {config?.signin}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => popupCenter("/signin", "Sign In")}
        >
          {"Sign In"}
        </Button>
      </Grid>
    </Paper>
  );
}
