import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import { Grid, Button, Typography } from "@mui/material";

export default function Unverified({ config, provider, setSignature }) {
  const [message, setMessage] = useState(undefined);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      setMessage(
        `${config.message}${session.session.user.name}\n${session.session.user.email}\n\n${session.id}`
      );
    }
  }, [session]);

  return (
    <Grid item xs={12} container justifyContent="center">
      <Typography align="center" paragraph>
        {config?.verify}
      </Typography>

      <Button
        variant="outlined"
        color="secondary"
        onClick={() =>
          provider.getSigner().then((signer) =>
            signer
              .signMessage(message)
              .then((sig) => setSignature(sig))
              .catch((e) => console.error(e))
          )
        }
      >
        Verify
      </Button>
    </Grid>
  );
}
