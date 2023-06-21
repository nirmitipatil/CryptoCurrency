import React from "react";
import AuctionDeployment from "./components/AuctionDeployment";
import LookupInfo from "./components/LookupAuction";
import SubmitBid from "./components/SubmitBid";

function App() {
  return (
    <div>
      <AuctionDeployment />
      <hr />
      <LookupInfo />
      <hr />
      <SubmitBid />
    </div>
  );
}

export default App;
