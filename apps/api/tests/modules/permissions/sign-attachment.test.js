import { signAttachment } from "../../../src/modules/permissions/helpers/sign-attachment.js";
import { createSignedUrls } from "../../../src/lib/storage.js";

vi.mock("../../../src/lib/storage.js", () => ({
  __esModule: true,
  createSignedUrls: vi.fn(),
}));
vi.mock("../../../src/utils/logger.js", () => ({
  __esModule: true,
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("signAttachment", () => {
  test("tanpa lampiran → tidak memanggil storage", async () => {
    const permission = { id: "p1", attachmentUrl: null };
    expect(await signAttachment(permission)).toBe(permission);
    expect(createSignedUrls).not.toHaveBeenCalled();
  });

  test("ada lampiran → attachmentUrl_url diisi signed url", async () => {
    createSignedUrls.mockResolvedValue(
      new Map([["a.pdf", "https://signed.example/a.pdf"]]),
    );
    const result = await signAttachment({ id: "p1", attachmentUrl: "a.pdf" });
    expect(result.attachmentUrl_url).toBe("https://signed.example/a.pdf");
  });

  test("storage gagal → attachmentUrl_url null, bukan url basi", async () => {
    createSignedUrls.mockRejectedValue(new Error("down"));
    const result = await signAttachment({ id: "p1", attachmentUrl: "a.pdf" });
    expect(result.attachmentUrl_url).toBeNull();
  });
});
