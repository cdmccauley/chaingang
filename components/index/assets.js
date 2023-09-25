import React, { useEffect, useState } from "react";

import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";

import { useSession } from "next-auth/react";

export default function Assets(props) {
  const { data: session, status, update } = useSession();

  const [assets, setAssets] = useState();
  const [selected, setSelected] = useState("");
  const [link, setLink] = useState();
  const [links, setLinks] = useState();

  const handleChange = (event) => {
    setSelected(event.target.value);
  };

  const handleClick = (event) => {
    fetch(link).then(() => {
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);
    });
  };

  useEffect(() => {
    if (props?.assets?.length > 0) setAssets(props.assets);
  }, [props]);

  useEffect(() => {
    if (selected && session?.token?.sub)
      setLink(`/api/client/assets/get/${selected}/${session?.token?.sub}`);
  }, [selected]);

  useEffect(() => {
    if (session?.links) setLinks(session?.links);
  }, [session]);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        minWidth: "256px",
        maxWidth: "256px",
      }}
    >
      <Grid container justifyContent="center">
        {assets?.length > 0 ? (
          <FormControl fullWidth sx={{ color: "#fff" }}>
            <InputLabel id="select-label">Assets</InputLabel>
            <Select
              labelId="select-label"
              id="select"
              value={selected}
              label="Assets"
              onChange={handleChange}
            >
              {assets.map((a) => (
                <MenuItem key={a.ruleName} value={a.ruleName}>
                  {a.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : undefined}

        {link ? (
          <Button sx={{ mt: 2 }} variant="outlined" onClick={handleClick}>
            Request Link
          </Button>
        ) : undefined}

        {links?.length > 0 ? (
          <Grid container justifyContent="center">
            {links.map((l) => (
              <Link
                key={l.ruleName}
                sx={{ mt: 2 }}
                href={`${l.link}`}
                target="_blank"
              >
                {l.displayName}
              </Link>
            ))}
          </Grid>
        ) : undefined}
      </Grid>
    </Paper>
  );
}
