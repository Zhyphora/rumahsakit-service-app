import { Request, Response } from "express";
import { RoleService } from "../services/RoleService";

const roleService = new RoleService();

export class RoleController {
  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      const role = await roleService.create({ name, description });
      res.status(201).json(role);
    } catch (error: any) {
      if (error.code === "23505") {
        // Unique constraint
        res.status(400).json({ message: "Role name already exists" });
        return;
      }
      res.status(500).json({ message: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const roles = await roleService.findAll();
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const role = await roleService.findOne(req.params.id);
      if (!role) {
        res.status(404).json({ message: "Role not found" });
        return;
      }
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const role = await roleService.update(req.params.id, req.body);
      if (!role) {
        res.status(404).json({ message: "Role not found" });
        return;
      }
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await roleService.delete(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
