import notificationService from "../../../src/modules/notifications/notification.service.js";
import notificationRepository from "../../../src/modules/notifications/notification.repository.js";
import bus from "../../../src/lib/events.js";
import { NotFoundError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/notifications/notification.repository.js", () => ({
  __esModule: true,
  default: {
    create: vi.fn(),
    createMany: vi.fn(),
    findActiveAdminIds: vi.fn(),
    findByUser: vi.fn(),
    countUnread: vi.fn(),
    findByIdForUser: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));
vi.mock("../../../src/lib/events.js", () => ({
  __esModule: true,
  default: { emit: vi.fn() },
  EVENTS: { PERMISSION_DECIDED: "permission.decided" },
}));
vi.mock("../../../src/utils/logger.js", () => ({
  __esModule: true,
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("notifyUser", () => {
  test("sukses → simpan + emit event + kembalikan row", async () => {
    const row = { id: "n1" };
    notificationRepository.create.mockResolvedValue(row);
    const result = await notificationService.notifyUser({
      userId: "u1",
      type: "INFO",
      title: "Hi",
      body: "test",
      event: "custom.event",
    });
    expect(result).toBe(row);
    expect(bus.emit).toHaveBeenCalledWith("custom.event", expect.objectContaining({ userId: "u1" }));
  });

  test("repository error → kembalikan null, tidak melempar", async () => {
    notificationRepository.create.mockRejectedValue(new Error("boom"));
    const result = await notificationService.notifyUser({ userId: "u1" });
    expect(result).toBeNull();
    expect(bus.emit).not.toHaveBeenCalled();
  });
});

describe("notifyAllAdmins", () => {
  test("tidak ada admin aktif → { count: 0 } tanpa createMany", async () => {
    notificationRepository.findActiveAdminIds.mockResolvedValue([]);
    const result = await notificationService.notifyAllAdmins({ type: "INFO" });
    expect(result).toEqual({ count: 0 });
    expect(notificationRepository.createMany).not.toHaveBeenCalled();
  });

  test("ada admin → createMany 1 baris per admin + emit", async () => {
    notificationRepository.findActiveAdminIds.mockResolvedValue(["a1", "a2"]);
    notificationRepository.createMany.mockResolvedValue({ count: 2 });
    const result = await notificationService.notifyAllAdmins({
      type: "INFO",
      title: "T",
      event: "e",
    });
    expect(result).toEqual({ count: 2 });
    const rows = notificationRepository.createMany.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.userId)).toEqual(["a1", "a2"]);
    expect(bus.emit).toHaveBeenCalledWith("e", expect.any(Object));
  });
});

describe("markAsRead", () => {
  test("notifikasi tidak ada / bukan milik user → NotFoundError", async () => {
    notificationRepository.findByIdForUser.mockResolvedValue(null);
    await expect(notificationService.markAsRead("n1", "u1")).rejects.toThrow(
      NotFoundError,
    );
  });

  test("sudah dibaca → kembalikan apa adanya tanpa markRead", async () => {
    const existing = { id: "n1", readAt: new Date("2026-01-01") };
    notificationRepository.findByIdForUser.mockResolvedValue(existing);
    const result = await notificationService.markAsRead("n1", "u1");
    expect(result).toBe(existing);
    expect(notificationRepository.markRead).not.toHaveBeenCalled();
  });

  test("belum dibaca → markRead dipanggil", async () => {
    notificationRepository.findByIdForUser.mockResolvedValue({ id: "n1", readAt: null });
    notificationRepository.markRead.mockResolvedValue({ id: "n1", readAt: new Date() });
    await notificationService.markAsRead("n1", "u1");
    expect(notificationRepository.markRead).toHaveBeenCalledWith("n1");
  });
});

describe("unreadCount / markAllAsRead", () => {
  test("unreadCount → { unread }", async () => {
    notificationRepository.countUnread.mockResolvedValue(3);
    await expect(notificationService.unreadCount("u1")).resolves.toEqual({ unread: 3 });
  });

  test("markAllAsRead → { updated }", async () => {
    notificationRepository.markAllRead.mockResolvedValue({ count: 5 });
    await expect(notificationService.markAllAsRead("u1")).resolves.toEqual({ updated: 5 });
  });
});
