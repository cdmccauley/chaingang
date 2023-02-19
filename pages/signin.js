import { useEffect, useState } from "react";

import Head from "next/head";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import theme from "../styles/theme";

import clientPromise from "../lib/mongodb";

import { useSession, signIn } from "next-auth/react";

import Image from "next/image";

import { Grid, Button, Paper, Typography } from "@mui/material";

export default function SignIn(props) {
  const [config, setConfig] = useState({
    title: "",
    description: "",
    signedin: "",
  });

  const { data: session, status } = useSession();

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
  }, []);

  useEffect(() => {
    if (status === "authenticated")
      setTimeout(() => {
        window.open("", "_parent", "");
        window.close();
      }, 1000);
  }, [status]);

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

        <Grid container spacing={2} justifyContent="center" sx={{ mt: 0.125 }}>
          {status === "unauthenticated" ? (
            <>
              <Grid item xs={12} container justifyContent="center">
                <Button variant="outlined" color="secondary" onClick={() => signIn("discord")}>
                  {"Connect Discord"}
                </Button>
              </Grid>
              <Grid item xs={12} container justifyContent="center">
                <Button variant="outlined" color="secondary" onClick={() => signIn("spotify")}>
                  {"Connect Spotify"}
                </Button>
              </Grid>
              <Grid item xs={12} container justifyContent="center">
                <Button variant="outlined" color="secondary" onClick={() => signIn("twitch")}>
                  {"Connect Twitch"}
                </Button>
              </Grid>
            </>
          ) : status === "authenticated" ? (
            <Grid item xs={12} container justifyContent="center">
              <Paper
                elevation={3}
                sx={{ p: 2, maxWidth: "256px", backgroundColor: "#4b0082" }}
              >
                <Typography>{config.signedin}</Typography>
              </Paper>
            </Grid>
          ) : undefined}
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
