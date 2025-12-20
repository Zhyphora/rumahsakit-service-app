import { AppDataSource } from "../config/database";
import { AccessControl } from "../entities/AccessControl";

import { Repository } from "typeorm";

export class AccessControlService {
  private accessRepo: Repository<AccessControl> =
    AppDataSource.getRepository(AccessControl);

  /** List all access control entries */
  async listAll(): Promise<AccessControl[]> {
    return this.accessRepo.find({
      relations: ["user", "role"],
      order: { role: { name: "ASC" }, feature: "ASC" },
    });
  }

  /** Set permission for a role OR user and feature. */
  async setPermission(
    roleId: string | null,
    userId: string | null,
    feature: string,
    allowed: boolean
  ): Promise<AccessControl> {
    if (!roleId && !userId) {
      throw new Error("Either roleId or userId must be provided");
    }

    const where: any = { feature };
    if (roleId) where.roleId = roleId;
    if (userId) where.userId = userId;

    const existing = await this.accessRepo.findOne({
      where,
    });

    if (!allowed) {
      if (existing) {
        await this.accessRepo.remove(existing);
      }
      return this.accessRepo.create({
        roleId: roleId || undefined,
        userId: userId || undefined,
        feature,
      });
    }

    if (existing) {
      return existing;
    }

    const newEntry = this.accessRepo.create({
      roleId: roleId || undefined,
      userId: userId || undefined,
      feature,
    });
    return this.accessRepo.save(newEntry);
  }

  /** Remove a permission by its id */
  async removePermission(id: string): Promise<void> {
    await this.accessRepo.delete(id);
  }

  /** Check if a role or user has access to a feature */
  async hasAccess(
    roleName: string | undefined,
    roleId: string | undefined,
    feature: string,
    userId?: string
  ): Promise<boolean> {
    if (roleName === "admin") return true;

    // Check role-based access
    if (roleId) {
      const roleAccess = await this.accessRepo.findOne({
        where: { roleId, feature },
      });
      if (roleAccess) return true;
    }

    // Check user-specific access
    if (userId) {
      const userAccess = await this.accessRepo.findOne({
        where: { userId, feature },
      });
      if (userAccess) return true;
    }

    return false;
  }
}
