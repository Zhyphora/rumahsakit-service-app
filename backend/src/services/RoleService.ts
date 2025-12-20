import { AppDataSource } from "../config/database";
import { Role } from "../entities/Role";
import { Repository } from "typeorm";

export class RoleService {
  private roleRepository: Repository<Role> = AppDataSource.getRepository(Role);

  async create(data: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ order: { name: "ASC" } });
  }

  async findOne(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async update(id: string, data: Partial<Role>): Promise<Role | null> {
    const role = await this.findOne(id);
    if (!role) return null;
    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  async delete(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
