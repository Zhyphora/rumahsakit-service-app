import { AppDataSource } from "../config/database";
import { AccessControl } from "../entities/AccessControl";
import { UserRole } from "../entities/User";
import { Repository } from "typeorm";

export class AccessControlService {
  private accessRepo: Repository<AccessControl> =
    AppDataSource.getRepository(AccessControl);

  /** List all access control entries */
  async listAll(): Promise<AccessControl[]> {
    return this.accessRepo.find();
  }

  /** Set permission for a role and feature. If exists, update; otherwise create */
  async setPermission(
    role: UserRole,
    feature: string,
    allowed: boolean
  ): Promise<AccessControl> {
    // allowed flag determines presence; if false, we delete any existing entry
    const existing = await this.accessRepo.findOne({
      where: { role, feature },
    });
    if (!allowed) {
      if (existing) {
        await this.accessRepo.remove(existing);
      }
      // Return a dummy object indicating removal
      return this.accessRepo.create({ role, feature });
    }
    if (existing) {
      // already allowed, return it
      return existing;
    }
    const newEntry = this.accessRepo.create({ role, feature });
    return this.accessRepo.save(newEntry);
  }

  /** Remove a permission by its id */
  async removePermission(id: string): Promise<void> {
    await this.accessRepo.delete(id);
  }

  /** Check if a role has access to a feature */
  async hasAccess(role: UserRole, feature: string): Promise<boolean> {
    const count = await this.accessRepo.count({ where: { role, feature } });
    return count > 0;
  }
}
