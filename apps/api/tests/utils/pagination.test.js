import { getPagination, paginationMeta } from "../../src/utils/pagination.js";

describe("getPagination", () => {
  test("nilai normal → hitung skip = (page-1)*limit", () => {
    expect(getPagination(2, 20)).toEqual({
      page: 2,
      limit: 20,
      skip: 20,
      take: 20,
    });
  });

  test("tanpa argumen → default page 1, limit 10", () => {
    expect(getPagination()).toEqual({ page: 1, limit: 10, skip: 0, take: 10 });
  });

  test("string angka di-coerce ke number", () => {
    expect(getPagination("3", "15")).toMatchObject({
      page: 3,
      limit: 15,
      skip: 30,
    });
  });

  test("nilai negatif di-clamp ke minimal 1", () => {
    expect(getPagination(-5, -5)).toMatchObject({ page: 1, limit: 1, skip: 0 });
  });

  test("0 / non-number jatuh ke default (bukan 0)", () => {
    expect(getPagination(0, 0)).toMatchObject({ page: 1, limit: 10 });
    expect(getPagination("abc", null)).toMatchObject({ page: 1, limit: 10 });
  });
});

describe("paginationMeta", () => {
  test("totalPages = ceil(total/limit) + flag hasNext/hasPrevious", () => {
    expect(paginationMeta({ total: 25, page: 1, limit: 10 })).toEqual({
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  test("halaman tengah → hasNext & hasPrevious keduanya true", () => {
    expect(paginationMeta({ total: 25, page: 2, limit: 10 })).toMatchObject({
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  test("halaman terakhir → hasNextPage false", () => {
    expect(paginationMeta({ total: 25, page: 3, limit: 10 })).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  test("total 0 → totalPages 0, tidak ada next/previous", () => {
    expect(paginationMeta({ total: 0, page: 1, limit: 10 })).toMatchObject({
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
