import { useEffect, useState } from "react";

import { signOut, useSession } from "next-auth/react";

import { useConnectWallet, useAccountCenter } from "@web3-onboard/react";
import { ethers } from "ethers";

import Grid from "@mui/material/Grid";

import Connected from "./connected";
import Disconnected from "./disconnected";
import Assets from "./assets";

export default function SignedIn({ config }) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const updateAccountCenter = useAccountCenter();

  const [provider, setProvider] = useState(null);

  // gating

  const [loaded, setLoaded] = useState(false);
  const { data: session, status } = useSession();
  const [serverState, setServerState] = useState();
  const [assets, setAssets] = useState();

  // end gating

  const disconnectWallet = () => {
    if (wallet) disconnect(wallet);
    if (provider) setProvider(null);
  };

  useEffect(() => {
    updateAccountCenter({ enabled: false });
    if (!loaded) setLoaded(true); // gating
  }, []);

  useEffect(() => {
    if (wallet && window.ethereum == null) {
      setProvider(ethers.getDefaultProvider());
    } else if (wallet) {
      if (wallet?.label === "MetaMask" || wallet?.label === "GameStop Wallet") {
        setProvider(new ethers.BrowserProvider(window.ethereum));
      } else if (wallet?.label === "WalletConnect") {
        setProvider(new ethers.BrowserProvider(wallet.provider));
      }
    }
  }, [wallet]);

  // gating

  useEffect(() => {
    if (session && !loaded && !serverState) {
      // first encounter
      setServerState({
        prior: [],
        current: session?.assets
          ?.map((a) => (a?.ruleName ? a : undefined))
          .filter((a) => a)
          .sort(),
      });
    } else if (session && loaded) {
      // session refresh
      const last = serverState?.current;
      const next = session?.assets
        ?.map((a) => (a?.ruleName ? a : undefined))
        .filter((a) => a)
        .sort();
      setServerState({
        prior: last,
        current: next,
      });
    }
  }, [session]);

  useEffect(() => {
    if (serverState) {
      if (
        (serverState?.prior?.length == 0 && serverState?.current?.length > 0) ||
        (serverState?.prior?.length > 0 &&
          JSON.stringify(serverState?.prior) !=
            JSON.stringify(serverState?.current))
      ) {
        setAssets(serverState?.current);
      }
    }
  }, [serverState]);

  // end gating

  return (
    <>
      {assets?.length > 0 ? (
        <Grid item sx={{ mb: 2 }} xs={12} container justifyContent="center">
          <Assets assets={assets} />
        </Grid>
      ) : undefined}
      {wallet ? (
        <Connected
          config={config}
          provider={provider}
          wallet={wallet}
          disconnectWallet={disconnectWallet}
          signOut={signOut}
        />
      ) : (
        <Disconnected
          config={config}
          connect={connect}
          connecting={connecting}
          signOut={signOut}
        />
      )}
    </>
  );
}
