import { useEffect, useMemo, useState } from "react"
import { ChatExample } from "./chat/ChatExample"

type ExampleRoute = {
  path: string
  title: string
  description: string
  Component: () => JSX.Element
}

const routes: ExampleRoute[] = [
  {
    path: "/chat",
    title: "AI chat",
    description: "A real OpenAI-compatible chat page rendered with uinify.",
    Component: ChatExample,
  },
]

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "")
  return normalized === "" ? "/" : normalized
}

function resolveRoute(pathname: string) {
  return routes.find((route) => route.path === normalizePath(pathname))
}

export function ExamplesApp() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePath(window.location.pathname))
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  useEffect(() => {
    if (pathname === "/") {
      window.history.replaceState(null, "", routes[0].path)
      setPathname(routes[0].path)
    }
  }, [pathname])

  const activeRoute = useMemo(() => resolveRoute(pathname), [pathname])

  const navigate = (path: string) => {
    if (path === pathname) {
      return
    }

    window.history.pushState(null, "", path)
    setPathname(path)
  }

  return (
    <div className="examples-shell">
      <aside className="examples-sidebar" aria-label="Examples">
        <header>
          <p>uinify examples</p>
          <h1>Examples</h1>
        </header>

        <nav aria-label="Example routes">
          {routes.map((route) => (
            <a
              aria-current={activeRoute?.path === route.path ? "page" : undefined}
              href={route.path}
              key={route.path}
              onClick={(event) => {
                event.preventDefault()
                navigate(route.path)
              }}
            >
              <span>{route.title}</span>
              <small>{route.description}</small>
            </a>
          ))}
        </nav>
      </aside>

      <main className="examples-main">
        {activeRoute ? (
          <activeRoute.Component />
        ) : (
          <section className="examples-not-found" aria-label="Example route not found">
            <p>Example not found.</p>
            <button type="button" onClick={() => navigate(routes[0].path)}>
              Open chat
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
