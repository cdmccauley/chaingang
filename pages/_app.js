import "../styles/globals.css";

import web3Onboard from "../lib/web3-onboard";
import { Web3OnboardProvider } from "@web3-onboard/react";

export default function App({ Component, pageProps }) {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <Component {...pageProps} />
    </Web3OnboardProvider>
  );
}
