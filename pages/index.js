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
import { Container, Button } from "@mui/material";

import { useConnectWallet, useAccountCenter } from "@web3-onboard/react";
import { ethers } from "ethers";

export default function Home(props) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const updateAccountCenter = useAccountCenter();

  const [config, setConfig] = useState({
    title: "",
    description: "",
    message: "",
  });
  const [clientId, setClientId] = useState("");

  const [provider, setProvider] = useState(null);
  const [signature, setSignature] = useState(null);

  const disconnectWallet = () => {
    if (wallet) disconnect(wallet);
    if (provider) setProvider(null);
    if (signature) setSignature(null);
  };

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
    if (props.clientId) setClientId(props.clientId);
    updateAccountCenter({ enabled: false });
  }, []);

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
    if (signature) console.log("signature", signature);
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
      <Button
        disabled={props.connecting}
        variant="outlined"
        onClick={() => (wallet ? disconnectWallet() : connect())}
      >
        {connecting ? "connecting" : wallet ? "disconnect" : "connect"}
      </Button>
      {!wallet || signature !== null ? undefined : (
        <Button
          disabled={!wallet || signature !== null}
          variant="outlined"
          onClick={() =>
            provider.getSigner().then((signer) =>
              signer
                .signMessage(`${config.message}${clientId}`)
                .then((sig) => setSignature(sig))
                .catch((e) => console.error(e))
            )
          }
        >
          Verify
        </Button>
      )}
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          padding: "24px",
          width: "100vw",
          height: "100vh",
        }}
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
    const serversideprops = await db.collection("serversideprops");
    const clients = await db.collection("clients");

    const config = await serversideprops.findOne({ name: "config" });

    const expired = new Date().valueOf() - 8.64e7;
    await clients.deleteMany({ created: { $lt: expired } });

    const clientId = crypto.randomUUID();

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
