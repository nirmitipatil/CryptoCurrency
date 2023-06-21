import React from "react";

const initialAppContext = {
  contractAddress: "",
}

export const AppContext = React.createContext(initialAppContext);
