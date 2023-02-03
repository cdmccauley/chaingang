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
import { Container } from "@mui/material";

export default function Home(props) {
  const [config, setConfig] = useState({ title: "", description: "" });
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
    if (props.clientId) setClientId(props.clientId);
  }, []);

  useEffect(() => {
    if (config.fun) console.info(config.fun);
  }, [config]);

  useEffect(() => {
    if (process.env.PUBLIC_VERCEL_ENV != "production" && clientId)
      console.info(clientId);
  }, [clientId]);

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
      <Container
        sx={{ display: "flex", justifyContent: "center", padding: "24px" }}
      >
        <Image
          src="/android-chrome-512x512.png"
          width={256}
          height={256}
          alt=""
        />
      </Container>
    </ThemeProvider>
  );
}

export async function getServerSideProps(context) {
  try {
    const client = await clientPromise;
    const db = await client.db("frontend");
    const collection = await db.collection("serversideprops");
    const config = await collection.findOne({ name: "config" });

    const clientId = crypto.randomUUID();

    const clients = await db.collection("clients");
    await clients.insertOne({
      _id: clientId,
      created: new Date().valueOf(),
    });

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
