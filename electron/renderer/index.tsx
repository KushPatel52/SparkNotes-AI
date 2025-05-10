import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App";
import "./src/index.css";

declare global {
  interface Window {
    electronAPI: {
      selectImages: () => Promise<string[]>;
      processImages: (args: any) => void;
      selectVideo: () => Promise<string | null>;
      processVideo: (args: any) => void;
      onJobStatus: (callback: (...args: any[]) => void) => void;
    };
  }
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />); 