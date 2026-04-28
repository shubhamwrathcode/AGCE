import React, { useEffect } from "react";
import NavigationService from "../../navigation/NavigationService";
import { ACCOUNT_SCREEN } from "../../navigation/routes";

/**
 * Earning Portfolio screen is replaced by Earning Dashboard tab.
 * Redirects to Staking (Earning) tab with Dashboard tab open where portfolio cards are shown.
 */
const EarningPortfolio = () => {
  useEffect(() => {
    NavigationService.navigate(ACCOUNT_SCREEN, { initialTab: 1 });
  }, []);

  return null;
};

export default EarningPortfolio;
