import { useEffect, useState } from "react";

import Head from "next/head";
import Image from "next/image";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import theme from "../styles/theme";

import clientPromise from "../lib/mongodb";

import { Grid } from "@mui/material";

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

  const { data: session, status } = useSession();

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
  }, []);

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
