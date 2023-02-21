import { useEffect, useState } from "react";

import { Grid, Button, Paper } from "@mui/material";

import Unverified from "./unverified";
import Verified from "./verified";

export default function Connected({
  config,
  provider,
  wallet,
  disconnectWallet,
  signOut,
}) {
  const [verified, setVerified] = useState(false);
  const [signature, setSignature] = useState(undefined);

  useEffect(() => {
    if (signature) {
      if (wallet?.accounts[0].address) {
        fetch("/api/client/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: wallet.accounts[0].address,
            signature: signature,
          }),
        })
          .then((res) => setVerified(res.ok))
          .catch((e) => console.error(e));
      }
    }
  }, [signature]);

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, maxWidth: "256px", backgroundColor: "#4b0082" }}
    >
      {verified ? (
        <Verified config={config} />
      ) : (
        <Unverified
          config={config}
          provider={provider}
          setSignature={setSignature}
        />
      )}
      <Grid item sx={{ mt: 1.5 }} xs={12} container justifyContent="center">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            if (wallet) disconnectWallet();
            signOut();
          }}
        >
          Disconnect
        </Button>
      </Grid>
    </Paper>
  );
}
