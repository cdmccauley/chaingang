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

import crypto from "crypto";

import { Grid, Button, Paper, Typography } from "@mui/material";

import { useConnectWallet, useAccountCenter } from "@web3-onboard/react";
import { ethers } from "ethers";

import { useSession, signIn, signOut } from "next-auth/react";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import * as cookie from "cookie";

export default function Home(props) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const updateAccountCenter = useAccountCenter();

  const [config, setConfig] = useState({
    title: "",
    description: "",
    message: "",
    initiate: "",
    sign: "",
    finalize: "",
  });
  const [clientId, setClientId] = useState("");

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
    if (props.clientId) setClientId(props.clientId);
    updateAccountCenter({ enabled: false });
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (message !== `${config.message}${session.user.name}\n${clientId}`)
        setMessage(`${config.message}${session.user.name}\n${clientId}`);
    } else {
      if (message !== `${config.message}${clientId}`)
        setMessage(`${config.message}${clientId}`);
    }
  }, [status]);

  useEffect(() => {
    if (wallet && window.ethereum == null) {
      setProvider(ethers.getDefaultProvider());
    } else if (wallet) {
      if (
        (wallet.label && wallet.label === "MetaMask") ||
        wallet.label === "GameStop Wallet"
      ) {
        setProvider(new ethers.BrowserProvider(window.ethereum));
      } else if (wallet.label && wallet.label === "WalletConnect") {
        setProvider(new ethers.BrowserProvider(wallet.provider));
      }
    }
  }, [wallet]);

  useEffect(() => {
    if (signature) {
      if (clientId !== "" && wallet && wallet.accounts[0].address) {
        fetch("/api/client/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: clientId,
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
              {status !== "authenticated" && !wallet
                ? config.initiate
                : status !== "authenticated" && wallet && !verified
                ? config.sign
                : status !== "authenticated" && wallet && verified
                ? config.signin
                : status === "authenticated" && !wallet
                ? config.finalize
                : status === "authenticated" && wallet && !verified
                ? config.sign
                : status === "authenticated" && wallet && verified
                ? config.signout
                : "error"}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} container justifyContent="center">
          <Button
            disabled={props.connecting}
            variant="outlined"
            onClick={() => (wallet ? disconnectWallet() : connect())}
          >
            {connecting ? "connecting" : wallet ? "disconnect" : "connect"}
          </Button>
        </Grid>

        {!wallet || signature !== null ? undefined : (
          <Grid item xs={12} container justifyContent="center">
            <Button
              disabled={!wallet || signature !== null}
              variant="outlined"
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
        )}

        {verified || status === "authenticated" ? (
          <Grid item xs={12} container justifyContent="center">
            <Button
              disabled={!verified}
              variant="outlined"
              onClick={() =>
                status === "unauthenticated"
                  ? signIn("twitch", {
                      callbackUrl:
                        process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                          ? `https://${process.env.NEXT_PUBLIC_PROD_HOST}/?id=${clientId}`
                          : `http://localhost:3000/?id=${clientId}`,
                    })
                  : status === "authenticated"
                  ? signOut("twitch", {
                      callbackUrl:
                        process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                          ? `https://${process.env.NEXT_PUBLIC_PROD_HOST}/?id=${clientId}`
                          : `http://localhost:3000/?id=${clientId}`,
                    })
                  : console.error("unexpected error")
              }
            >
              {status === "unauthenticated"
                ? "Twitch Sign In"
                : status === "authenticated"
                ? "Sign Out"
                : "Twitch"}
            </Button>
          </Grid>
        ) : undefined}
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

    // get/maintain clients
    const clients = await frontend.collection("clients");
    const expired = new Date().valueOf() - 8.64e7;
    await clients.deleteMany({ created: { $lt: expired } });

    // start checks for clientId
    let clientId;

    // get csrf-token
    const cookies = context.req.headers.cookie;
    const clientCsrfToken = cookies
      ? cookie.parse(cookies)["next-auth.csrf-token"]?.split("|")[0]
      : undefined;

    // get session
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    );

    // if csrf-token and session, likely return from login
    const isLoginReturn =
      clientCsrfToken && session
        ? new Date(session.expires).valueOf() > new Date().valueOf()
        : false;

    // start checks for existing clientID
    let existingClient;

    // if likely return from login, we want to know clientId
    if (isLoginReturn)
      existingClient = await clients.findOne({
        csrfToken: clientCsrfToken,
      });

    if (existingClient) clientId = existingClient._id;

    // if not likely return from login or not found, give a new id
    if (!clientId) {
      clientId = crypto.randomUUID();

      await clients.insertOne({
        _id: clientId,
        created: new Date().valueOf(),
      });
    }

    return {
      props: {
        isConnected: true,
        config: JSON.stringify(config),
        clientId: clientId,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { isConnected: false },
    };
  }
}
