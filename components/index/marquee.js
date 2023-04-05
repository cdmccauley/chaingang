import { Grid, Paper, Typography, CircularProgress } from "@mui/material";
import { useEffect } from "react";

export default function Marquee(props) {
  useEffect(() => {
    if (props?.events) {
      const date = new Date();
      const day = date.getDay();
      const midnight = date.setHours(24, 0, 0, 0);
      const max = date.setDate(date.getDate() + 7);

      const midnights = Array.from(Array(7), (empty, i) =>
        i === 0 ? midnight : midnight + i * 8.64e7
      );

      let calendar = midnights.map((midnight, i) => {
        return { day: day + i < 7 ? day + i : day - 7 + i, end: midnight };
      });

      calendar.forEach(
        (day, i) =>
          (day.events = props?.events.filter(
            (event) =>
              event.dates.end > day.end && event.dates.days.includes(day.day)
          ))
      );

      console.log(calendar);
    }
  }, [props]);

  return (
    <Paper elevation={3} sx={{ p: 2, minWidth: "256px" }}>
      <Grid container justifyContent="center">
        <Grid item container justifyContent="center" sx={{ mt: 2 }}>
          <Typography align="center" paragraph>
            Loading...
          </Typography>
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
