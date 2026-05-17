import { cpSync, mkdirSync } from "node:fs"

mkdirSync("dist", { recursive: true })
cpSync("src/styles.css", "dist/styles.css")
