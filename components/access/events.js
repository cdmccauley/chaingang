import React, { useEffect, useState } from "react";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import { DataGrid } from "@mui/x-data-grid";

import Actions from "./actions";
import Create from "./create";

import * as dayjs from "dayjs";
var utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const columns = [
  { field: "start", headerName: "Event Start", width: 175 },
  { field: "end", headerName: "Event End", width: 175 },
  { field: "days", headerName: "Days", width: 160 },
  {
    field: "activityStart",
    headerName: "Activity Start",
  },
  {
    field: "activityEnd",
    headerName: "Activity End",
  },
  { field: "duration", headerName: "Duration", width: 110 },
  { field: "giveaway", headerName: "Giveaway?", width: 90 },
  { field: "public", headerName: "Public?", width: 75 },
  { field: "cancelled", headerName: "Cancelled?", width: 90 },
  { field: "id", headerName: "ID", width: 225 },
];

export default function Events({ config, features }) {
  const [events, setEvents] = useState(undefined);
  const [table, setTable] = useState(undefined);

  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getEvents = async () => {
    await fetch(`/api/client/events/twitch/${features.configs.home}`, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": features.key,
      },
    })
      .then((res) => (res.ok ? res.json() : undefined))
      .then((res) => {
        if (res && res?.events?.length > 0) {
          setEvents(res?.events);
          console.log(res?.events);
        }
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
          date.setTime(e.dates.start);
          const start = date.toLocaleString();
          date.setUTCHours(e.hour, e.minute, 0, 0);
          const location = date.getTimezoneOffset();
          const activityStart = date.toLocaleTimeString();
          date.setTime(date.valueOf() + e.duration);
          const activityEnd = date.toLocaleTimeString();

          let shift = 0;

          if (location > 0) {
            if (
              date.getUTCFullYear() > date.getFullYear() ||
              date.getUTCMonth() > date.getMonth() ||
              date.getUTCDate() > date.getDate()
            )
              shift = 1;
          } else if (location < 0) {
            if (
              date.getUTCFullYear() < date.getFullYear() ||
              date.getUTCMonth() < date.getMonth() ||
              date.getUTCDate() < date.getDate()
            )
              shift = -1;
          }

          let shifted = e.days;

          if (shift < 0) {
            shifted = e.days.map((d) => (d + 1 > 6 ? 0 + (d + 1 - 7) : d + 1));
          } else if (shift > 0) {
            shifted = e.days.map((d) =>
              d - 1 < 0 ? 7 - Math.abs(d - 1) : d - 1
            );
          }

          return {
            start: start,
            end: end,
            days: shifted.map((day) => days[day]).toString(),
            activityStart,
            activityEnd,
            duration: `${Math.round(e.duration / 60000)} Minutes`,
            public: e?.public ? "Yes" : "No",
            giveaway: e?.giveaway ? "Yes" : "No",
            cancelled: e?.cancelled ? "Yes" : "No",
            id: e?._id,
          };
        })
      );
    }
  }, [events]);

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
