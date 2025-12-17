import { AppDataSource } from "../config/database";
import { AccessControl } from "../entities/AccessControl";
import { UserRole } from "../entities/User";
import { Repository } from "typeorm";

export class AccessControlService {
  private accessRepo: Repository<AccessControl> =
    AppDataSource.getRepository(AccessControl);

  /** List all access control entries */
  async listAll(): Promise<AccessControl[]> {
    return this.accessRepo.find({
      relations: ["user"],
      order: { role: "ASC", feature: "ASC" },
    });
  }

  /** Set permission for a role OR user and feature. */
  async setPermission(
    role: UserRole | null,
    userId: string | null,
    feature: string,
    allowed: boolean
  ): Promise<AccessControl> {
    if (!role && !userId) {
      throw new Error("Either role or userId must be provided");
    }

    const where: any = { feature };
    if (role) where.role = role;
    if (userId) where.userId = userId;

    const existing = await this.accessRepo.findOne({
      where,
    });

    if (!allowed) {
      if (existing) {
        await this.accessRepo.remove(existing);
      }
      return this.accessRepo.create({
        role: role || undefined,
        userId: userId || undefined,
        feature,
      });
    }

    if (existing) {
      return existing;
    }

    const newEntry = this.accessRepo.create({
      role: role || undefined,
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
    role: UserRole,
    feature: string,
    userId?: string
  ): Promise<boolean> {
    if (role === "admin") return true;

    // Check role-based access
    const roleAccess = await this.accessRepo.findOne({
      where: { role, feature },
    });
    if (roleAccess) return true;

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
