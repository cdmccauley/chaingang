import injectedModule, { ProviderLabel } from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";

import { init } from "@web3-onboard/react";

const resources = `${process.env.NEXT_PUBLIC_RESOURCES_ROOT}/public/default`;

const customTheme = {
  "--w3o-background-color": "#583866", // right side, button
  "--w3o-foreground-color": "#392742", // left side, button hover
  "--w3o-text-color": "#fff", // text, close icon
  "--w3o-border-color": "#ccc",
  "--w3o-action-color": "#583866", // breadcrumb
  "--w3o-border-radius": "10px",
};

const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;

const injected = injectedModule({
  filter: {
    [ProviderLabel.Detected]: false,
  },
});

const walletConnect = walletConnectModule();

export default init({
  wallets: [injected, walletConnect],
  chains: [
    {
      id: "0x1",
      namespace: "evm",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
  ],
  theme: customTheme,
  appMetadata: {
    name: process.env.NEXT_PUBLIC_NAME,
    icon: `M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z`,
    logo: `${resources}/icon.png`,
    description: process.env.NEXT_PUBLIC_DESCRIPTION,
    recommendedInjectedWallets: [
      {
        name: "GameStop Wallet",
        url: "https://wallet.gamestop.com/",
      },
      {
        name: "MetaMask",
        url: "https://metamask.io",
      },
    ],
  },
});
