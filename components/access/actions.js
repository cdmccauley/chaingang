import React, { useEffect, useState } from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Actions({ props }) {
  const [eventId, setEventId] = useState(undefined);

  const [open, setOpen] = useState(false);
  const [alert, setAlert] = useState(undefined);

  const [report, setReport] = useState(undefined);

  useEffect(() => {
    if (alert) setOpen(true);
  }, [alert]);

  useEffect(() => {
    if (report) console.log("report", report);
  }, [report]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const handleAction = (action) => {
    let sev = "warning";
    let message = "no ID";

    if (eventId) {
      fetch(
        `/api/client/events/twitch/${props.features.configs.home}/${action}`,
        {
          method: "POST",
          headers: {
            "X-API-KEY": props.features.key,
          },
          body: JSON.stringify({
            _id: eventId,
          }),
        }
      )
        .then((res) => {
          if (res.ok) {
            props.getEvents();
            return res.json();
          }
        })
        .then((json) => setReport(json))
        .catch((e) => console.error(e));
      sev = "success";
      message = props.config.sent;
    }

    setAlert(
      <Alert onClose={handleClose} severity={sev} sx={{ width: "100%" }}>
        {message}
      </Alert>
    );
  };

  return (
    <Grid container spacing={2}>
      <Grid item container sx={{ ml: 2, mt: 2 }}>
        <Grid item>Event Actions</Grid>
      </Grid>

      <Grid item container spacing={3}>
        <Grid item>
          <FormControlLabel
            labelPlacement="start"
            control={
              <TextField
                sx={{ ml: 2 }}
                size="small"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              />
            }
            label="ID"
          />
        </Grid>
      </Grid>

      <Grid item container spacing={3}>
        <Grid item sx={{ ml: 6 }}>
          <Button variant="outlined" onClick={(e) => handleAction("report")}>
            Event Report
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={(e) => handleAction("cancel")}>
            Cancel Event
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={props.getEvents}>
            Refresh
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        {alert}
      </Snackbar>
    </Grid>
  );
}
