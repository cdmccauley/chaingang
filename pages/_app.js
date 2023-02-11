import "../styles/globals.css";

import web3Onboard from "../lib/web3-onboard";
import { Web3OnboardProvider } from "@web3-onboard/react";

import { SessionProvider } from "next-auth/react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </Web3OnboardProvider>
  );
}
