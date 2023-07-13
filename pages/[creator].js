import React, { useEffect, useState } from "react";

import Head from "next/head";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { createTheme } from "@mui/material/styles";
import { default as defaultTheme } from "../styles/darktheme";

import clientPromise from "../lib/mongodb";

import {
  Grid,
  Avatar,
  Paper,
  Typography,
  AppBar,
  Container,
  Toolbar,
  Box,
  Slide,
} from "@mui/material";

import { AccountBalanceWalletOutlined } from "@mui/icons-material";

import { useSession } from "next-auth/react";

import Loading from "../components/index/loading";
import SignedOut from "../components/index/signedout";
import SignedIn from "../components/index/signedin";

import Marquee from "../components/index/marquee";

export default function Home(props) {
  const [resources, setResources] = useState(
    `${process.env.NEXT_PUBLIC_RESOURCES_ROOT}/public/client`
  );

  const [ready, setReady] = useState(false);

  const [config, setConfig] = useState(undefined);
  const [branding, setBranding] = useState(undefined);
  const [theme, setTheme] = useState(createTheme(defaultTheme));

  const { data: session, status } = useSession();

  const [events, setEvents] = useState(undefined);

  useEffect(() => {
    if (!config && props?.config) setConfig(JSON.parse(props.config));
    if (!branding && props?.branding) setBranding(JSON.parse(props.branding));
  }, [props]);

  useEffect(() => {
    if (branding?.name)
      setResources(
        `${
          process.env.NEXT_PUBLIC_RESOURCES_ROOT
        }/public/${branding.name.toLowerCase()}`
      );
    if (branding?.theme) setTheme(createTheme(branding.theme));
  }, [branding]);

  useEffect(() => {
    if (config && branding) setReady(true);
  }, [config, branding]);

  useEffect(() => {
    if (ready) {
      fetch(`/api/client/events/twitch/${branding.name.toLowerCase()}`)
        .then((res) => (res.ok ? res.json() : undefined))
        .then((res) => {
          if (res && res?.events?.length > 0) setEvents(res?.events);
        })
        .catch((e) => console.error(e));
    }
  }, [ready]);

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>
          {ready
            ? branding.name !== "default"
              ? `${branding.name}@${config.title}`
              : config.title
            : ""}
        </title>
        <meta name="description" content={config?.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${resources}/apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${resources}/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${resources}/favicon-16x16.png`}
        />
        <link rel="manifest" href={`${resources}/site.webmanifest`} />
      </Head>
      <CssBaseline enableColorScheme />
      <AppBar color="inherit" position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: "flex" }}>
              <AccountBalanceWalletOutlined sx={{ mr: 2, mt: 0.5 }} />
              <Typography
                variant="h6"
                color="primary"
                noWrap
                component="a"
                href="/"
                sx={{
                  mr: 2,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".2rem",
                  textDecoration: "none",
                }}
              >
                {ready ? config.title.toUpperCase() : undefined}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <Typography>
                {ready && branding.name !== "default"
                  ? `${branding.name}@${config.title}`
                  : undefined}
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Grid
        container
        spacing={2}
        justifyContent="center"
        sx={{ mt: 0.125, pb: 2 }}
      >
        <Grid item xs={12} container spacing={2} justifyContent="center">
          {ready ? (
            <React.Fragment>
              <Grid item xs={12} container justifyContent="center">
                <Paper elevation={2} sx={{ p: 2, width: 256, height: 256 }}>
                  <Grid item xs={12} container justifyContent="center">
                    <Avatar
                      sx={{ width: 224, height: 224 }}
                      src={`${resources}/android-chrome-512x512.png`}
                      alt=""
                    />
                  </Grid>
                </Paper>
              </Grid>

              <Slide
                direction="up"
                in={events ? true : false}
                mountOnEnter
                unmountOnExit
              >
                <Grid item xs={12} container justifyContent="center">
                  {/* <Marquee events={events} /> */}
                </Grid>
              </Slide>

              <Grid item xs={12} container justifyContent="center">
                {status !== "unauthenticated" && status !== "authenticated" ? (
                  <Loading />
                ) : undefined}

                {status === "unauthenticated" ? (
                  <SignedOut config={config} />
                ) : status === "authenticated" ? (
                  <SignedIn config={config} />
                ) : undefined}
              </Grid>
            </React.Fragment>
          ) : (
            <Grid item xs={12} container justifyContent="center">
              <Loading />
            </Grid>
          )}
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}

export async function getServerSideProps(context) {
  try {
    const mongo = await clientPromise;
    const frontend = await mongo.db("frontend");
    const serversideprops = await frontend.collection("serversideprops");
    const config = await serversideprops.findOne({ name: "config" });
    const serverConfig = await serversideprops.findOne({
      name: "server-config",
    });

    const name =
      context?.query?.creator &&
      serverConfig?.creators.some(
        (creator) =>
          creator.toLowerCase() === context?.query?.creator?.toLowerCase()
      )
        ? serverConfig?.creators[
            serverConfig?.creators.findIndex(
              (creator) =>
                creator.toLowerCase() === context?.query?.creator?.toLowerCase()
            )
          ]
        : "default";

    const branding = {
      name: name,
      theme:
        name === "default"
          ? {
              palette: {
                text: {
                  primary: "#FFFFFF",
                },
                background: {
                  default: "#392742",
                  paper: "#583866",
                },
                primary: { main: "#FFFFFF" },
              },
            }
          : serverConfig.themes[`${name.toLowerCase()}`],
    };

    return {
      props: {
        isConnected: true,
        config: JSON.stringify(config),
        branding: JSON.stringify(branding),
      },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { isConnected: false },
    };
  }
}
