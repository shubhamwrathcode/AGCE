import React from "react";
import GenericWalletTab from "./GenericWalletTab";

const FuturesWalletTab = (props) => {
  return (
    <GenericWalletTab
      {...props}
      title="Futures Wallet Balance"
      hideZeroDefault={false}
    />
  );
};

export default FuturesWalletTab;

