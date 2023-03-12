import { useEffect, useState } from "react";

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
  CircularProgress,
} from "@mui/material";

import { AccountBalanceWalletOutlined } from "@mui/icons-material";

import { useSession } from "next-auth/react";

import Loading from "../components/index/loading";
import SignedOut from "../components/index/signedout";
import SignedIn from "../components/index/signedin";

export default function Home(props) {
  const [config, setConfig] = useState({
    name: "",
    title: "",
    description: "",
    message: "",
    signin: "",
    connect: "",
    verified: "",
    verify: "",
    signedin: "",
  });

  const [branding, setBranding] = useState({ name: "client" });
  const [delay, setDelay] = useState(true);

  const [theme, setTheme] = useState(createTheme(defaultTheme));

  const { data: session, status } = useSession();

  useEffect(() => {
    if (props?.config) setConfig(JSON.parse(props.config));
    if (props?.branding) {
      const branding = JSON.parse(props.branding);
      setBranding(branding);
      setTheme(
        createTheme(branding.name === "client" ? defaultTheme : branding.theme)
      );
      setTimeout(() => setDelay(false), 1000);
    }
  }, []);

  const resources = `${
    process.env.NEXT_PUBLIC_RESOURCES_ROOT
  }/public/${branding.name.toLowerCase()}`;

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>
          {branding?.name == "client" || branding?.name == "default"
            ? config.title
            : `${branding.name}@${config.title}`}
        </title>
        <meta name="description" content={config.description} />
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
                {config?.title ? config.title.toUpperCase() : ""}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <Typography>
                {branding && branding.name !== "default"
                  ? `${branding.name}@${config.title}`
                  : undefined}
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 0.125 }}>
        <Grid item xs={12} container justifyContent="center">
          {!branding ? (
            ""
          ) : (
            <Grid item xs={12} container justifyContent="center">
              <Paper elevation={2} sx={{ p: 2, width: 256, height: 256 }}>
                <Grid item xs={12} container justifyContent="center">
                  {branding?.name === "default" && delay ? (
                    <CircularProgress sx={{ mt: 12 }} thickness={5} />
                  ) : (
                    <Avatar
                      sx={{ width: 224, height: 224 }}
                      src={`${resources}/android-chrome-512x512.png`}
                      alt=""
                    />
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
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
                  default: "#3c096c",
                  paper: "#663399",
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
