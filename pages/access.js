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

import {
  Grid,
  Button,
  Typography,
  AppBar,
  Container,
  Toolbar,
  Paper,
  Avatar,
  Box,
} from "@mui/material";

import { AccountBalanceWalletOutlined } from "@mui/icons-material";

import Loading from "../components/access/loading";
import SignedOut from "../components/access/signedout";
import SignedIn from "../components/access/signedin";

import Events from "../components/access/events";

export default function SignIn(props) {
  const [config, setConfig] = useState({
    title: "",
    description: "",
  });

  const [features, setFeatures] = useState(undefined);

  const { data: session, status, update: sessionUpdate } = useSession();

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
  }, []);

  useEffect(() => {
    if (!features || features.key != session?.features.key) {
      setFeatures(session?.features);
    }
  }, [session]);

  const resources = `${process.env.NEXT_PUBLIC_RESOURCES_ROOT}/public/default`;

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
      <AppBar color="inherit" position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: "flex" }}>
              <AccountBalanceWalletOutlined sx={{ mr: 2 }} />
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
              {status !== "unauthenticated" && status !== "authenticated" ? (
                <Loading />
              ) : undefined}

              {status === "unauthenticated" ? (
                <SignedOut />
              ) : status === "authenticated" ? (
                <SignedIn />
              ) : undefined}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Grid container spacing={2} justifyContent="center" sx={{ mt: 0.125 }}>
        <Grid item xs={12} container justifyContent="center">
          {features && features.features.includes("events") ? (
            <Events config={config} features={features} />
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
