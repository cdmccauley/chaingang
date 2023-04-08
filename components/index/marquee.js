import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItem from "@mui/material/ListItem";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Link from "@mui/material/Link";

import React, { useEffect, useState } from "react";

export default function Marquee(props) {
  const [weekdays, setWeekdays] = useState(undefined);
  const [providers, setProviders] = useState(undefined);

  const [open, setOpen] = React.useState(
    Array.from(Array(7), (empty, i) => (i === 0 ? true : false))
  );

  const handleClick = (j) => {
    setOpen(Array.from(Array(7), (empty, i) => (j === i ? true : false)));
  };

  useEffect(() => {
    if (props?.events && !weekdays) {
      const client = new Date();
      const server = new Date();
      const now = server.valueOf();

      const weekdays = Array.from(Array(7), (empty, i) => {
        client.setTime(now);
        client.setHours(0, 0, 0);
        client.setDate(client.getDate() + i);

        const utcStart = client.valueOf();
        server.setTime(utcStart);
        server.setUTCHours(0, 0, 0);
        const serverStartA = server.valueOf();
        const clientDay = client.getDay();
        const uDayA = client.getUTCDay();

        client.setHours(23, 59, 59);
        const uDayB = client.getUTCDay();
        const utcEnd = client.valueOf();
        server.setTime(utcEnd);
        server.setUTCHours(0, 0, 0);
        const serverStartB = server.valueOf();

        const aEvents = props.events
          .filter(
            (event) =>
              event.dates.start <= utcEnd &&
              event.dates.end >= utcStart &&
              event.dates.end >= now &&
              event.dates.days.includes(uDayA) &&
              new Date(
                serverStartA +
                  event.times.start.hour * 60 * 60 * 1000 +
                  event.times.start.minute * 60 * 1000
              ).getDay() === clientDay
          )
          .map((event) => {
            return {
              provider: event.provider,
              channel: event.channel,
              link: event.link,
              cancelled: event.cancelled,
              start:
                serverStartA +
                event.times.start.hour * 60 * 60 * 1000 +
                event.times.start.minute * 60 * 1000,
              end:
                serverStartA +
                event.times.end.hour * 60 * 60 * 1000 +
                event.times.end.minute * 60 * 1000,
            };
          });

        const bEvents = props.events
          .filter(
            (event) =>
              event.dates.start <= utcEnd &&
              event.dates.end >= utcStart &&
              event.dates.end >= now &&
              event.dates.days.includes(uDayB) &&
              new Date(
                serverStartB +
                  event.times.start.hour * 60 * 60 * 1000 +
                  event.times.start.minute * 60 * 1000
              ).getDay() === clientDay
          )
          .map((event) => {
            return {
              provider: event.provider,
              channel: event.channel,
              link: event.link,
              cancelled: event.cancelled,
              start:
                serverStartB +
                event.times.start.hour * 60 * 60 * 1000 +
                event.times.start.minute * 60 * 1000,
              end:
                serverStartB +
                event.times.end.hour * 60 * 60 * 1000 +
                event.times.end.minute * 60 * 1000,
            };
          });

        return {
          date: new Date(utcStart),
          events: [...aEvents, ...bEvents].sort((a, b) => a.start - b.start),
        };
      });

      if (weekdays) setWeekdays(weekdays.filter((w) => w.events.length > 0));
    }
  }, [props]);

  useEffect(() => {
    if (weekdays) {
      setProviders(
        weekdays
          .map((w) =>
            w.events.map((e) => {
              return { provider: e.provider, link: e.link };
            })
          )
          .flat()
          .filter(
            (v, i, a) => i === a.findIndex((j) => j.provider === v.provider)
          )
      );
    }
  }, [weekdays]);

  return weekdays?.length > 0 ? (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        minWidth: "256px",
        maxWidth: "256px",
      }}
    >
      <Grid container justifyContent="center">
        <Grid item>
          <Typography variant="h6">
            {providers?.map((p, i) =>
              i === 0 && providers.length > 1
                ? `${p.provider.toUpperCase()},`
                : `${p.provider.toUpperCase()} `
            )}
            STREAMS
          </Typography>
        </Grid>

        {providers?.map((p, i) => (
          <Grid key={i} item>
            <Link href={p.link} underline="none" target="_blank" rel="noopener">
              {p.link.replace("https://www.", "")}
            </Link>
          </Grid>
        ))}

        <List
          component="nav"
          disablePadding
          dense
          sx={{ width: "100%", maxWidth: 256, mt: 1.5 }}
        >
          {weekdays.map((weekday, i) => (
            <React.Fragment key={i}>
              <ListItemButton
                alignItems="center"
                onClick={() => handleClick(i)}
              >
                <Grid spacing={2} container justifyContent="space-between">
                  <Grid item>{weekday.date.toDateString()}</Grid>
                  <Grid item>{open[i] ? <ExpandLess /> : <ExpandMore />}</Grid>
                </Grid>
              </ListItemButton>
              <Collapse in={open[i]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding dense>
                  {weekday.events.map((event, i) => (
                    <ListItem key={i} dense disablePadding>
                      <Grid container justifyContent="space-evenly">
                        <Grid item>
                          <Typography key={i} paragraph sx={{ mb: .5 }}>
                            {new Date(event.start).toLocaleTimeString()}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Typography key={i} paragraph sx={{ mb: .25 }}>
                            {(
                              Math.abs(
                                new Date(event.start) - new Date(event.end)
                              ) / 36e5
                            ).toFixed(2)}{" "}
                            Hours
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Grid>
    </Paper>
  ) : undefined;
}
