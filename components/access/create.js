import React, { useEffect, useState } from "react";

import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers";

import * as dayjs from "dayjs";
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Create({ props }) {
  const [start, setStart] = useState(
    dayjs()
      .set("hour", dayjs().get("hour") + 1)
      .set("minute", 0)
      .set("second", 0)
  );
  const [end, setEnd] = useState(
    dayjs()
      .set("day", dayjs().get("day") + 1)
      .set("hour", dayjs().get("hour") + 1)
      .set("minute", 0)
      .set("second", 0)
  );

  const [startTime, setStartTime] = useState(
    dayjs()
      .set("hour", dayjs().get("hour") + 1)
      .set("minute", 0)
      .set("second", 0)
  );
  const [endTime, setEndTime] = useState(
    dayjs()
      .set("hour", dayjs().get("hour") + 1)
      .set("minute", 0)
      .set("second", 0)
  );

  const [selected, setSelected] = useState([]);

  const [marquee, setMarquee] = useState(false);
  const [giveaway, setGiveaway] = useState(false);

  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(undefined);

  useEffect(() => {
    if (alert) setOpen(true);
  }, [alert]);

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;

    setSelected(typeof value === "string" ? value.split(",") : value);
  };

  const handleCreate = (event) => {
    let sev = "warning";
    let message = [];

    if (end.valueOf() < start.valueOf())
      message = [...message, props.config.event];
    if (startTime.valueOf() > endTime.valueOf())
      message = [...message, props.config.activity];

    if (selected.length < 1) message = [...message, props.config.days];

    if (message.length == 0) {
      sev = "success";
      message = [props.config.sent];

      fetch(`/api/client/events/twitch/${props.features.configs.home}/create`, {
        method: "POST",
        headers: {
          "X-API-KEY": props.features.key,
        },
        body: JSON.stringify({
          dates: {
            start: start.valueOf(),
            end: end.valueOf(),
            days: selected,
          },
          times: {
            start: {
              hour: dayjs.utc(startTime).hour(),
              minute: dayjs.utc(startTime).minute(),
            },
            end: {
              hour: dayjs.utc(endTime).hour(),
              minute: dayjs.utc(endTime).minute(),
            },
          },
          public: marquee,
          giveaway: giveaway,
        }),
      })
        .then((res) => {
          if (res.ok) props.getEvents();
        })
        .catch((e) => console.error(e));
    }

    setAlert(
      <Alert onClose={handleClose} severity={sev} sx={{ width: "100%" }}>
        {message.toString()}
      </Alert>
    );
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Grid container spacing={2}>
      <Grid item container sx={{ ml: 2, mt: 2 }}>
        <Grid item>Create Event</Grid>
      </Grid>

      <Grid item container spacing={3}>
        <Grid item>
          <FormControlLabel
            labelPlacement="start"
            control={
              <DateTimePicker
                sx={{ ml: 2.75 }}
                onChange={(v) => setStart(v)}
                defaultValue={start}
              />
            }
            label="Event Start"
          />
        </Grid>

        <Grid item>
          <FormControlLabel
            labelPlacement="start"
            control={
              <DateTimePicker
                sx={{ ml: 3.7 }}
                disablePast
                onChange={(v) => setEnd(v)}
                minDateTime={dayjs(start)}
                defaultValue={end}
              />
            }
            label="Event End"
          />
        </Grid>
      </Grid>

      <Grid container item spacing={2}>
        <Grid item>
          <FormControlLabel
            labelPlacement="start"
            control={
              <TimePicker
                sx={{ ml: 1 }}
                onChange={(v) => setStartTime(v)}
                defaultValue={start}
              />
            }
            label="Activity Start"
          />
        </Grid>

        <Grid item>
          <FormControlLabel
            sx={{ ml: 3 }}
            labelPlacement="start"
            control={
              <TimePicker
                sx={{ ml: 2 }}
                onChange={(v) => setEndTime(v)}
                minTime={dayjs(startTime)}
                defaultValue={dayjs(start)}
              />
            }
            label="Activity End"
          />
        </Grid>
      </Grid>

      <Grid container item spacing={2}>
        <Grid item>
          <FormControlLabel
            labelPlacement="start"
            control={
              <Select
                sx={{ ml: 8.2, minWidth: 263 }}
                multiple
                value={selected}
                onChange={handleChange}
              >
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            }
            label="Days"
          />
        </Grid>

        <Grid item>
          <FormControlLabel
            sx={{ ml: 3 }}
            labelPlacement="start"
            control={
              <Checkbox value={marquee} onChange={() => setMarquee(!marquee)} />
            }
            label="Public?"
          />
        </Grid>

        <Grid item>
          <FormControlLabel
            sx={{ ml: 0.7 }}
            labelPlacement="start"
            control={
              <Checkbox
                value={giveaway}
                onChange={() => setGiveaway(!giveaway)}
              />
            }
            label="Giveaway?"
          />
        </Grid>

        <Grid item>
          <Button variant="outlined" onClick={(e) => handleCreate(e)}>
            Create Event
          </Button>
        </Grid>
      </Grid>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        {alert}
      </Snackbar>
    </Grid>
  );
}
