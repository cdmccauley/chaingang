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

import { Grid, Button } from "@mui/material";

export default function SignIn(props) {
  const [config, setConfig] = useState({
    title: "",
    description: "",
    message: "",
    signin: "",
    connect: "",
    verify: "",
    verified: "",
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
        {status === "unauthenticated" ? (
          <>
            <Grid item xs={12} container justifyContent="center">
              <Button
                variant="outlined"
                onClick={() =>
                  signIn("discord", {
                    callbackUrl:
                      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                        ? `https://${process.env.NEXT_PUBLIC_PROD_HOST}/close`
                        : `http://localhost:3000/close`,
                  })
                }
              >
                {"Connect Discord"}
              </Button>
            </Grid>
            <Grid item xs={12} container justifyContent="center">
              <Button
                variant="outlined"
                onClick={() =>
                  signIn("twitch", {
                    callbackUrl:
                      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                        ? `https://${process.env.NEXT_PUBLIC_PROD_HOST}/close`
                        : `http://localhost:3000/close`,
                  })
                }
              >
                {"Connect Twitch"}
              </Button>
            </Grid>
          </>
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
