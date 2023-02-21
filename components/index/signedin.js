import { useEffect, useState } from "react";

import { signOut } from "next-auth/react";

import { useConnectWallet, useAccountCenter } from "@web3-onboard/react";
import { ethers } from "ethers";

import Connected from "./connected";
import Disconnected from "./disconnected";

export default function SignedIn({ config }) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const updateAccountCenter = useAccountCenter();

  const [provider, setProvider] = useState(null);

  const disconnectWallet = () => {
    if (wallet) disconnect(wallet);
    if (provider) setProvider(null);
  };

  useEffect(() => {
    updateAccountCenter({ enabled: false });
  }, []);

  useEffect(() => {
    if (wallet && window.ethereum == null) {
      setProvider(ethers.getDefaultProvider());
    } else if (wallet) {
      if (wallet?.label === "MetaMask" || wallet?.label === "GameStop Wallet") {
        setProvider(new ethers.BrowserProvider(window.ethereum));
      } else if (wallet?.label === "WalletConnect") {
        setProvider(new ethers.BrowserProvider(wallet.provider));
      }
    }
  }, [wallet]);

  return (
    <>
      {wallet ? (
        <Connected
          config={config}
          provider={provider}
          wallet={wallet}
          disconnectWallet={disconnectWallet}
          signOut={signOut}
        />
      ) : (
        <Disconnected
          config={config}
          connect={connect}
          connecting={connecting}
          signOut={signOut}
        />
      )}
    </>
  );
}
