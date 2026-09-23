import {
  describe,
  expect,
  it,
} from "vitest";

import {
  canDeleteUsers,
  canManageUsers,
} from "./permissions";

describe("User permission helpers", () => {
  describe("canManageUsers", () => {
    it("allows Administrator to manage users", () => {
      expect(
        canManageUsers("Administrator")
      ).toBe(true);
    });

    it("allows Manager to manage users", () => {
      expect(
        canManageUsers("Manager")
      ).toBe(true);
    });

    it("does not allow User to manage users", () => {
      expect(
        canManageUsers("User")
      ).toBe(false);
    });

    it("does not allow undefined role", () => {
      expect(
        canManageUsers(undefined)
      ).toBe(false);
    });
  });

  describe("canDeleteUsers", () => {
    it("allows Administrator to delete users", () => {
      expect(
        canDeleteUsers("Administrator")
      ).toBe(true);
    });

    it("does not allow Manager to delete users", () => {
      expect(
        canDeleteUsers("Manager")
      ).toBe(false);
    });

    it("does not allow User to delete users", () => {
      expect(
        canDeleteUsers("User")
      ).toBe(false);
    });

    it("does not allow undefined role", () => {
      expect(
        canDeleteUsers(undefined)
      ).toBe(false);
    });
  });
});