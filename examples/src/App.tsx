import { useEffect } from "react"
import { ChatExample } from "./chat/ChatExample"

const chatPath = "/chat"
const githubUrl = "https://github.com/z0gSh1u/uinify"

export function ExamplesApp() {
  useEffect(() => {
    if (window.location.pathname !== chatPath) {
      window.history.replaceState(null, "", chatPath)
    }
  }, [])

  return (
    <div className="examples-shell">
      <header className="examples-topbar">
        <a className="examples-brand" href={chatPath}>
          uinify examples
        </a>
        <a
          aria-label="Open z0gSh1u/uinify on GitHub"
          className="examples-github-link"
          href={githubUrl}
          rel="noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
            <path
              clipRule="evenodd"
              d="M12 1C5.9 1 1 5.9 1 12c0 4.9 3.2 9 7.6 10.5.6.1.8-.2.8-.5v-1.9c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.2 2.6 2.9 1.8.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.4 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.5.1-3 0 0 .9-.3 3 1.1.9-.2 1.8-.4 2.7-.4s1.8.1 2.7.4c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.7.1 3 .7.8 1.1 1.8 1.1 3 0 4.2-2.6 5.1-5.1 5.4.4.3.8 1 .8 2.1v3c0 .3.2.6.8.5C19.8 21 23 16.9 23 12c0-6.1-4.9-11-11-11Z"
              fillRule="evenodd"
            />
          </svg>
        </a>
      </header>
      <main className="examples-main">
        <ChatExample />
      </main>
    </div>
  )
}
