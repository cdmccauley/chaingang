import { useEffect, useState } from "react";

import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

import clientPromise from "../lib/mongodb";

export default function Home(props) {
  const [config, setConfig] = useState({ title: "", description: "" });

  useEffect(() => {
    if (props.config) setConfig(JSON.parse(props.config));
  }, []);

  useEffect(() => {
    if (config.fun) console.info(config.fun)
  }, [config])

  return (
    <>
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
      <main className={styles.main}>
        <Image src="/android-chrome-512x512.png" width={256} height={256} alt="" />
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  try {
    const client = await clientPromise;
    const db = await client.db("frontend");
    const collection = await db.collection("serversideprops");
    const config = await collection.findOne({ name: "config" });
    return {
      props: { isConnected: true, config: JSON.stringify(config) },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { isConnected: false },
    };
  }
}
