import { useEffect, useState } from "react";

import Head from "next/head";
import Image from "next/image";

// import styles from "../styles/Home.module.css";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import theme from "../styles/theme";

import clientPromise from "../lib/mongodb";

import { Grid, Button, Paper, Typography } from "@mui/material";

import { useConnectWallet, useAccountCenter } from "@web3-onboard/react";
import { ethers } from "ethers";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Home(props) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const updateAccountCenter = useAccountCenter();

  const [config, setConfig] = useState({
    title: "",
    description: "",
    message: "",
    signin: "",
    connect: "",
    verify: "",
    verified: "",
  });

  const [provider, setProvider] = useState(null);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState(null);

  const [verified, setVerified] = useState(false);

  const disconnectWallet = () => {
    if (wallet) disconnect(wallet);
    if (provider) setProvider(null);
    if (message) setMessage("");
    if (signature) setSignature(null);
    if (verified) setVerified(false);
  };

  const { data: session, status } = useSession();

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
    updateAccountCenter({ enabled: false });
  }, []);

  useEffect(() => {
    if (session) {
      setMessage(
        `${config.message}${session.session.user.name}\n${session.session.user.email}\n\n${session.id}`
      );
    }
  }, [session]);

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

  const popupCenter = (url, title) => {
    const dualScreenLeft = window.screenLeft ?? window.screenX;
    const dualScreenTop = window.screenTop ?? window.screenY;

    const width =
      window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;

    const height =
      window.innerHeight ??
      document.documentElement.clientHeight ??
      screen.height;

    const systemZoom = width / window.screen.availWidth;

    const left = (width - 500) / 2 / systemZoom + dualScreenLeft;
    const top = (height - 650) / 2 / systemZoom + dualScreenTop;

    const newWindow = window.open(
      url,
      title,
      `location=0,toolbar=0,width=450,height=650,top=${top},left=${left}`
    );

    newWindow?.focus();
  };

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <CssBaseline enableColorScheme />

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 0.125 }}>
        <Grid item xs={12} container justifyContent="center">
          <Image
            src="/android-chrome-512x512.png"
            width={256}
            height={256}
            alt=""
          />
        </Grid>

        <Grid item xs={12} container justifyContent="center">
          <Paper
            elevation={3}
            sx={{ p: 2, maxWidth: "256px", backgroundColor: "#4b0082" }}
          >
            <Typography>
              {status === "unauthenticated"
                ? config.signin
                : status === "authenticated"
                ? !wallet
                  ? config.connect
                  : signature && !verified
                  ? "Verifying..."
                  : !verified
                  ? config.verify
                  : verified
                  ? config.verified
                  : undefined
                : undefined}
            </Typography>
          </Paper>
        </Grid>

        {!verified &&
        status === "authenticated" &&
        wallet &&
        signature !== "" ? (
          <Grid item xs={12} container justifyContent="center">
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
        ) : undefined}

        {status === "authenticated" && !verified ? (
          <Grid item xs={12} container justifyContent="center">
            <Button
              disabled={props.connecting}
              color="secondary"
              variant="outlined"
              onClick={() => (wallet ? disconnectWallet() : connect())}
            >
              {connecting ? "connecting" : wallet ? "disconnect" : "connect"}
            </Button>
          </Grid>
        ) : undefined}

        <Grid item xs={12} container justifyContent="center">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              if (status === "unauthenticated") {
                popupCenter("/signin", "Sign In");
              } else if (status === "authenticated") {
                if (wallet) disconnectWallet();
                signOut();
              }
            }}
          >
            {status === "unauthenticated"
              ? "Sign In"
              : status === "authenticated" && !verified
              ? "Sign Out"
              : "Disconnect"}
          </Button>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export async function getServerSideProps(context) {
  try {
    // get config
    const mongo = await clientPromise;
    const frontend = await mongo.db("frontend");
    const serversideprops = await frontend.collection("serversideprops");
    const config = await serversideprops.findOne({ name: "config" });

    return {
      props: {
        isConnected: true,
        config: JSON.stringify(config),
      },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { isConnected: false },
    };
  }
}
