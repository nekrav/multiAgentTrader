import { ConflictException } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { UsersService } from "./users.service";

function poolWithQuery(query: jest.Mock) {
  return { query } as never;
}

describe("UsersService", () => {
  it("creates users with normalized email and default role", async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [
        {
          id: "user-1",
          email: "vlad@example.com",
          display_name: "Vlad",
          role: "user",
        },
      ],
    } as never);
    const service = new UsersService(poolWithQuery(query));

    await expect(
      service.createUser({
        email: "Vlad@Example.COM",
        passwordHash: "hash",
        displayName: "Vlad",
      }),
    ).resolves.toEqual({
      id: "user-1",
      email: "vlad@example.com",
      displayName: "Vlad",
      role: "user",
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("insert into users"), [
      "vlad@example.com",
      "hash",
      "Vlad",
      "user",
    ]);
  });

  it("maps duplicate email database errors to ConflictException", async () => {
    const duplicate = Object.assign(new Error("duplicate key"), { code: "23505" });
    const service = new UsersService(poolWithQuery(jest.fn().mockRejectedValue(duplicate as never)));

    await expect(
      service.createUser({
        email: "vlad@example.com",
        passwordHash: "hash",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("returns password hash when finding a user by email", async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [
        {
          id: "user-2",
          email: "vlad@example.com",
          password_hash: "hash",
          display_name: null,
          role: "admin",
        },
      ],
    } as never);
    const service = new UsersService(poolWithQuery(query));

    await expect(service.findByEmail("VLAD@example.com")).resolves.toEqual({
      id: "user-2",
      email: "vlad@example.com",
      passwordHash: "hash",
      displayName: null,
      role: "admin",
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("where email = $1"), ["vlad@example.com"]);
  });
});
