import React from "react"
import ReactDOM from "react-dom/client"
import "../../src/styles.css"
import { ExamplePlayground } from "./App"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ExamplePlayground />
  </React.StrictMode>,
)
