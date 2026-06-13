import type { UiComposerAttachment } from "../../src/composer/lexical"
import {
  createImageAttachmentValidator,
  isUploadedImageAttachment,
  LIVE_CHAT_IMAGE_MAX_BYTES,
  readFileAsDataUrl,
} from "../../examples/src/chat/shared/files"

function createAttachment(file: File, overrides: Partial<UiComposerAttachment> = {}): UiComposerAttachment {
  return {
    id: `attachment-${file.name}`,
    file,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    status: "queued",
    ...overrides,
  }
}

describe("chat file helpers", () => {
  it("image validator accepts a normal image file", () => {
    const validator = createImageAttachmentValidator()
    const attachment = createAttachment(new File(["pixels"], "photo.png", { type: "image/png" }))

    expect(validator([attachment])).toEqual([{ ok: true, attachment }])
  })

  it("image validator rejects a non-image file", () => {
    const validator = createImageAttachmentValidator()
    const attachment = createAttachment(new File(["notes"], "notes.txt", { type: "text/plain" }))

    expect(validator([attachment])).toEqual([
      {
        ok: false,
        attachment: expect.objectContaining({
          name: "notes.txt",
          mimeType: "text/plain",
          size: attachment.size,
          sourceAttachmentId: attachment.id,
          status: "error",
          rejection: {
            code: "invalid-type",
            message: "Only image files can be attached.",
          },
        }),
      },
    ])
  })

  it("image validator rejects an oversized image file", () => {
    const validator = createImageAttachmentValidator()
    const oversizedBytes = new Uint8Array(LIVE_CHAT_IMAGE_MAX_BYTES + 1)
    const attachment = createAttachment(new File([oversizedBytes], "large.png", { type: "image/png" }))

    expect(validator([attachment])).toEqual([
      {
        ok: false,
        attachment: expect.objectContaining({
          name: "large.png",
          mimeType: "image/png",
          size: LIVE_CHAT_IMAGE_MAX_BYTES + 1,
          sourceAttachmentId: attachment.id,
          status: "error",
          rejection: {
            code: "file-too-large",
            message: "Images must be 4 MB or smaller.",
          },
        }),
      },
    ])
  })

  it("isUploadedImageAttachment returns true only for uploaded attachments with a string dataUrl", () => {
    const file = new File(["pixels"], "photo.png", { type: "image/png" })
    const uploadedWithDataUrl = createAttachment(file, { status: "uploaded" }) as UiComposerAttachment & {
      dataUrl: string
    }
    uploadedWithDataUrl.dataUrl = "data:image/png;base64,cGl4ZWxz"

    expect(isUploadedImageAttachment(uploadedWithDataUrl)).toBe(true)
    expect(
      isUploadedImageAttachment(
        Object.assign(createAttachment(file, { status: "queued" }), {
          dataUrl: "data:image/png;base64,cGl4ZWxz",
        }),
      ),
    ).toBe(false)
    expect(isUploadedImageAttachment(createAttachment(file, { status: "uploaded" }))).toBe(false)
    expect(
      isUploadedImageAttachment(
        Object.assign(createAttachment(file, { status: "uploaded" }), { dataUrl: 42 }),
      ),
    ).toBe(false)
  })

  it("readFileAsDataUrl resolves a data URL for an image File in jsdom", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" })

    await expect(readFileAsDataUrl(file)).resolves.toBe("data:image/png;base64,AQID")
  })
})
