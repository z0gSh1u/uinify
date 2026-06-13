import { SurfaceGalleryPanel } from "./gallery/SurfaceGalleryPanel"
import { LiveChatPanel } from "./live/LiveChatPanel"
import "./chat.css"

export function ChatExample() {
  return (
    <section className="chat-showcase" aria-label="uinify chat example showcase">
      <header className="chat-showcase-header">
        <div>
          <p>uinify example</p>
          <h1>Multimodal chat + UI surfaces</h1>
        </div>
        <div className="chat-showcase-status" aria-label="Example surfaces">
          <span>Live multimodal chat</span>
          <span>UI surface gallery</span>
        </div>
      </header>

      <div className="chat-showcase-grid">
        <LiveChatPanel />
        <SurfaceGalleryPanel />
      </div>
    </section>
  )
}
