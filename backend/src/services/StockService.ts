import { AppDataSource } from "../config/database";
import { Item } from "../entities/Item";
import { StockOpname, StockOpnameStatus } from "../entities/StockOpname";
import { StockOpnameItem } from "../entities/StockOpnameItem";
import { StockMovement } from "../entities/StockMovement";

export class StockService {
  private itemRepository = AppDataSource.getRepository(Item);
  private stockOpnameRepository = AppDataSource.getRepository(StockOpname);
  private stockOpnameItemRepository =
    AppDataSource.getRepository(StockOpnameItem);
  private stockMovementRepository = AppDataSource.getRepository(StockMovement);

  // Items CRUD
  async getItems(filters?: {
    category?: string;
    search?: string;
    lowStock?: boolean;
  }) {
    const query = this.itemRepository
      .createQueryBuilder("item")
      .where("item.is_active = true");

    if (filters?.category) {
      query.andWhere("item.category = :category", {
        category: filters.category,
      });
    }

    if (filters?.search) {
      query.andWhere("(item.name ILIKE :search OR item.code ILIKE :search)", {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.lowStock) {
      query.andWhere("item.current_stock <= item.min_stock");
    }

    return query.orderBy("item.name", "ASC").getMany();
  }

  async getItemById(id: string) {
    return this.itemRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async createItem(data: Partial<Item>) {
    const existing = await this.itemRepository.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error("Item code already exists");
    }

    const item = this.itemRepository.create(data);
    return this.itemRepository.save(item);
  }

  async updateItem(id: string, data: Partial<Item>) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new Error("Item not found");
    }

    Object.assign(item, data);
    return this.itemRepository.save(item);
  }

  async deleteItem(id: string) {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new Error("Item not found");
    }

    item.isActive = false;
    return this.itemRepository.save(item);
  }

  // Stock Opname
  async createStockOpname(createdBy: string, notes?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stockOpname = this.stockOpnameRepository.create({
      opnameDate: today,
      status: "draft",
      notes,
      createdBy,
    });

    return this.stockOpnameRepository.save(stockOpname);
  }

  async getStockOpnames(status?: StockOpnameStatus) {
    const query = this.stockOpnameRepository
      .createQueryBuilder("opname")
      .leftJoinAndSelect("opname.creator", "creator")
      .leftJoinAndSelect("opname.items", "items")
      .leftJoinAndSelect("items.item", "item");

    if (status) {
      query.where("opname.status = :status", { status });
    }

    return query.orderBy("opname.created_at", "DESC").getMany();
  }

  async getStockOpnameById(id: string) {
    return this.stockOpnameRepository.findOne({
      where: { id },
      relations: ["creator", "items", "items.item"],
    });
  }

  async addItemToOpname(
    opnameId: string,
    itemId: string,
    actualQty: number,
    notes?: string
  ) {
    const opname = await this.stockOpnameRepository.findOne({
      where: { id: opnameId },
    });
    if (!opname) {
      throw new Error("Stock opname not found");
    }

    if (opname.status === "completed") {
      throw new Error("Cannot add items to completed opname");
    }

    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new Error("Item not found");
    }

    // Check if item already in opname
    const existingItem = await this.stockOpnameItemRepository.findOne({
      where: { stockOpnameId: opnameId, itemId },
    });

    if (existingItem) {
      existingItem.actualQty = actualQty;
      if (notes) existingItem.notes = notes;
      return this.stockOpnameItemRepository.save(existingItem);
    }

    const opnameItem = this.stockOpnameItemRepository.create({
      stockOpnameId: opnameId,
      itemId,
      systemQty: item.currentStock,
      actualQty,
      notes,
    });

    // Update opname status to in_progress
    if (opname.status === "draft") {
      opname.status = "in_progress";
      await this.stockOpnameRepository.save(opname);
    }

    return this.stockOpnameItemRepository.save(opnameItem);
  }

  async completeStockOpname(opnameId: string, userId: string) {
    const opname = await this.stockOpnameRepository.findOne({
      where: { id: opnameId },
      relations: ["items", "items.item"],
    });

    if (!opname) {
      throw new Error("Stock opname not found");
    }

    if (opname.status === "completed") {
      throw new Error("Opname already completed");
    }

    // Adjust stock for each item
    for (const opnameItem of opname.items) {
      const difference = opnameItem.actualQty - opnameItem.systemQty;

      if (difference !== 0) {
        // Update item stock
        const item = opnameItem.item;
        item.currentStock = opnameItem.actualQty;
        await this.itemRepository.save(item);

        // Create stock movement
        const movement = this.stockMovementRepository.create({
          itemId: item.id,
          movementType: "adjustment",
          quantity: difference,
          referenceType: "stock_opname",
          referenceId: opnameId,
          notes: `Stock adjustment from opname. Difference: ${difference}`,
          createdBy: userId,
        });
        await this.stockMovementRepository.save(movement);
      }
    }

    // Complete opname
    opname.status = "completed";
    opname.completedAt = new Date();
    await this.stockOpnameRepository.save(opname);

    return opname;
  }

  // Stock Movements
  async getStockMovements(itemId?: string, limit = 50) {
    const query = this.stockMovementRepository
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.item", "item")
      .leftJoinAndSelect("movement.creator", "creator");

    if (itemId) {
      query.where("movement.item_id = :itemId", { itemId });
    }

    return query.orderBy("movement.created_at", "DESC").take(limit).getMany();
  }

  async adjustStock(
    itemId: string,
    quantity: number,
    notes: string,
    userId: string
  ) {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new Error("Item not found");
    }

    const oldStock = item.currentStock;
    item.currentStock += quantity;
    await this.itemRepository.save(item);

    const movement = this.stockMovementRepository.create({
      itemId,
      movementType: quantity > 0 ? "in" : "out",
      quantity: Math.abs(quantity),
      notes: `Manual adjustment: ${notes}. Old: ${oldStock}, New: ${item.currentStock}`,
      createdBy: userId,
    });
    await this.stockMovementRepository.save(movement);

    return item;
  }

  // Get low stock items
  async getLowStockItems() {
    return this.itemRepository
      .createQueryBuilder("item")
      .where("item.is_active = true")
      .andWhere("item.current_stock <= item.min_stock")
      .orderBy("item.current_stock", "ASC")
      .getMany();
  }
}
