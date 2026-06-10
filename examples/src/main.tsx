import React from "react"
import ReactDOM from "react-dom/client"
import "../../src/styles.css"
import "./examples.css"
import { ExamplesApp } from "./App"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ExamplesApp />
  </React.StrictMode>,
)
