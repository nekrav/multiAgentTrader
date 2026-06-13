import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { compare } from "bcryptjs";
import { AuthService } from "./auth.service";
import { AuthUser } from "./auth.types";

interface CreateUserCall {
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: "user" | "admin";
}

describe("AuthService", () => {
  const baseUser: AuthUser = {
    id: "user-1",
    email: "vlad@example.com",
    displayName: "Vlad",
    role: "user",
  };

  function createService(overrides?: {
    users?: Record<string, unknown>;
    credits?: Record<string, unknown>;
    jwt?: Record<string, unknown>;
  }) {
    const users = {
      createUser: jest.fn().mockResolvedValue(baseUser as never),
      findByEmail: jest.fn(),
      ...overrides?.users,
    };
    const credits = {
      grant: jest.fn().mockResolvedValue({ applied: true, balance: 50n } as never),
      getBalance: jest.fn().mockResolvedValue({ balance: "50", updatedAt: "2026-06-12T00:00:00.000Z" } as never),
      ...overrides?.credits,
    };
    const jwt = {
      sign: jest.fn().mockReturnValue("signed-token" as never),
      ...overrides?.jwt,
    };
    return {
      service: new AuthService(users as never, credits as never, jwt as never),
      users,
      credits,
      jwt,
    };
  }

  it("registers a normalized user, hashes the password, grants signup credits, and returns a token", async () => {
    const { service, users, credits, jwt } = createService();
    const previousSignupCredits = process.env.SIGNUP_CREDITS;
    process.env.SIGNUP_CREDITS = "75";

    try {
      const result = await service.register({
        email: " Vlad@Example.COM ",
        password: "correct-password",
        displayName: " Vlad ",
      });

      expect(result).toEqual({ token: "signed-token", user: baseUser });
      expect(users.createUser).toHaveBeenCalledWith({
        email: "vlad@example.com",
        passwordHash: expect.any(String),
        displayName: "Vlad",
        role: "user",
      });
      const passwordHash = ((users.createUser as jest.Mock).mock.calls[0][0] as CreateUserCall).passwordHash;
      await expect(compare("correct-password", passwordHash)).resolves.toBe(true);
      expect(credits.grant).toHaveBeenCalledWith("user-1", 75n, "Signup credit grant.", "signup:user-1");
      expect(jwt.sign).toHaveBeenCalledWith(baseUser);
    } finally {
      if (previousSignupCredits === undefined) {
        delete process.env.SIGNUP_CREDITS;
      } else {
        process.env.SIGNUP_CREDITS = previousSignupCredits;
      }
    }
  });

  it("assigns admin role during registration when email is configured as an admin", async () => {
    const previousAdminEmails = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "admin@example.com, vlad@example.com";
    const { service, users } = createService({
      users: {
        createUser: jest.fn().mockResolvedValue({ ...baseUser, role: "admin" } as never),
      },
    });

    try {
      await service.register({ email: "vlad@example.com", password: "correct-password" });
      expect(users.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "vlad@example.com",
          role: "admin",
        }),
      );
    } finally {
      if (previousAdminEmails === undefined) {
        delete process.env.ADMIN_EMAILS;
      } else {
        process.env.ADMIN_EMAILS = previousAdminEmails;
      }
    }
  });

  it("rejects invalid registration input", async () => {
    const { service, users, credits } = createService();

    await expect(service.register({ email: "invalid", password: "long-enough" })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.register({ email: "vlad@example.com", password: "short" })).rejects.toBeInstanceOf(ConflictException);
    expect(users.createUser).not.toHaveBeenCalled();
    expect(credits.grant).not.toHaveBeenCalled();
  });

  it("logs in with valid credentials and rejects invalid credentials", async () => {
    const { service, users, jwt } = createService();
    await service.register({ email: "vlad@example.com", password: "correct-password" });
    const createdUser = (users.createUser as jest.Mock).mock.calls[0][0] as CreateUserCall;
    (users.findByEmail as jest.Mock).mockResolvedValue({ ...baseUser, passwordHash: createdUser.passwordHash } as never);

    await expect(service.login({ email: "VLAD@example.com", password: "correct-password" })).resolves.toEqual({
      token: "signed-token",
      user: baseUser,
    });
    expect(users.findByEmail).toHaveBeenCalledWith("vlad@example.com");
    expect(jwt.sign).toHaveBeenLastCalledWith(baseUser);

    await expect(service.login({ email: "vlad@example.com", password: "wrong-password" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("returns account details and credit balance for the current user", async () => {
    const { service, credits } = createService();

    await expect(service.me(baseUser)).resolves.toEqual({
      user: baseUser,
      balance: { balance: "50", updatedAt: "2026-06-12T00:00:00.000Z" },
    });
    expect(credits.getBalance).toHaveBeenCalledWith("user-1");
  });
});
