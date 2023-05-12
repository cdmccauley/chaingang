import React, { useEffect, useState } from "react";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import Checkbox from "@mui/material/Checkbox";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";

import { DataGrid } from "@mui/x-data-grid";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers";

import Actions from "./actions";
import Create from "./create";

import * as dayjs from "dayjs";
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const columns = [
  { field: "start", width: 180, headerName: "Event Start" },
  { field: "end", width: 180, headerName: "Event End" },
  { field: "days", width: 160, headerName: "Days" },
  {
    field: "startTime",

    headerName: "Activity Start",
  },
  {
    field: "endTime",

    headerName: "Activity End",
  },
  { field: "giveaway", headerName: "Giveaway?" },
  { field: "public", headerName: "Public?" },
  { field: "cancelled", headerName: "Cancelled?" },
  { field: "id", width: 210, headerName: "ID" },
];

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Events({ config, features }) {
  const [events, setEvents] = useState(undefined);

  const [table, setTable] = useState(undefined);

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

  const [days, setDays] = useState(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
  const [selected, setSelected] = useState([]);

  const [marquee, setMarquee] = useState(false);
  const [giveaway, setGiveaway] = useState(false);

  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(undefined);

  const getEvents = async () => {
    await fetch(`/api/client/events/twitch/${features.configs.home}`, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": features.key,
      },
    })
      .then((res) => (res.ok ? res.json() : undefined))
      .then((res) => {
        if (res && res?.events?.length > 0) setEvents(res?.events);
      })
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    if (features && !events) {
      getEvents();
    }
  }, [features]);

  useEffect(() => {
    if (events) {
      setTable(
        events.map((e) => {
          const date = new Date(e?.dates?.end);
          const end = date.toLocaleString();

          date.setTime(e?.dates?.start);
          const start = date.toLocaleString();

          const startHour = new Date(
            date.setUTCHours(e?.times?.start?.hour)
          ).getHours();
          const startMinute = new Date(
            date.setUTCMinutes(e?.times?.start?.minute)
          ).getMinutes();
          const endHour = new Date(
            date.setUTCHours(e?.times?.end?.hour)
          ).getHours();
          const endMinute = new Date(
            date.setUTCMinutes(e?.times?.end?.minute)
          ).getMinutes();

          return {
            start: start,
            end: end,
            days: e?.dates?.days.map((day) => days[day]).toString(),
            startTime:
              startHour.toString() +
              ":" +
              (startMinute.toString().length > 1
                ? startMinute.toString()
                : "0" + startMinute.toString()),
            endTime:
              endHour.toString() +
              ":" +
              (endMinute.toString().length > 1
                ? endMinute.toString()
                : "0" + endMinute.toString()),
            public: e?.public ? "Yes" : "No",
            giveaway: e?.giveaway ? "Yes" : "No",
            cancelled: e?.cancelled ? "Yes" : "No",
            id: e?._id,
          };
        })
      );
    }
  }, [events]);

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
    const date = new Date();

    let sev = "warning";
    let message = [];

    if (end.valueOf() < start.valueOf()) message = [...message, config.event];
    if (startTime.valueOf() > endTime.valueOf())
      message = [...message, config.activity];

    if (selected.length < 1) message = [...message, config.days];

    if (message.length == 0) {
      sev = "success";
      message = [config.sent];

      fetch(`/api/client/events/twitch/${features.configs.home}/create`, {
        method: "POST",
        headers: {
          "X-API-KEY": features.key,
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
          if (res.ok) getEvents();
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
    <Box sx={{ width: "100vw", ml: 2, mr: 2 }}>
      {table ? (
        <Paper sx={{ p: 2 }}>
          {`walletlinked.com/${features?.configs?.home}`}
          <DataGrid
            disableRowSelectionOnClick
            density="comfortable"
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[10]}
            rows={table}
            columns={columns}
            sx={{ mt: 2, mb: 2 }}
          />

          <Grid container spacing={2}>
            <Actions props={{ config, features, getEvents }} />
            <Create props={{ config, features, getEvents }} />
          </Grid>
        </Paper>
      ) : undefined}
    </Box>
  );
}
