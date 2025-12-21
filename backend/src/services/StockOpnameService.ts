import { AppDataSource } from "../config/database";
import { StockOpname, StockOpnameStatus } from "../entities/StockOpname";
import { StockOpnameItem } from "../entities/StockOpnameItem";
import { Item } from "../entities/Item";
import { StockBatch } from "../entities/StockBatch";
import { StockCorrection } from "../entities/StockCorrection";
import { StockMovement, MovementType } from "../entities/StockMovement";
import { User } from "../entities/User";

export class StockOpnameService {
  private stockOpnameRepo = AppDataSource.getRepository(StockOpname);
  private stockOpnameItemRepo = AppDataSource.getRepository(StockOpnameItem);
  private itemRepo = AppDataSource.getRepository(Item);
  private stockBatchRepo = AppDataSource.getRepository(StockBatch);
  private stockCorrectionRepo = AppDataSource.getRepository(StockCorrection);
  private stockMovementRepo = AppDataSource.getRepository(StockMovement);

  /** Start a new stock opname (draft) */
  async startOpname(createdBy: string, notes?: string): Promise<StockOpname> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const opname = this.stockOpnameRepo.create({
      opnameDate: today,
      status: "draft" as StockOpnameStatus,
      notes,
      createdBy,
    });
    return this.stockOpnameRepo.save(opname);
  }

  /** Add or update an item in a draft/in‑progress opname */
  async addItem(
    opnameId: string,
    itemId: string,
    actualQty: number,
    notes?: string
  ): Promise<StockOpnameItem> {
    const opname = await this.stockOpnameRepo.findOne({
      where: { id: opnameId },
    });
    if (!opname) throw new Error("Stock opname not found");
    if (opname.status === "completed")
      throw new Error("Cannot modify a completed opname");

    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new Error("Item not found");

    const existing = await this.stockOpnameItemRepo.findOne({
      where: { stockOpnameId: opnameId, itemId },
    });
    if (existing) {
      existing.actualQty = actualQty;
      if (notes) existing.notes = notes;
      return this.stockOpnameItemRepo.save(existing);
    }

    const opnameItem = this.stockOpnameItemRepo.create({
      stockOpnameId: opnameId,
      itemId,
      systemQty: item.currentStock,
      actualQty,
      notes,
    });

    // move status to in_progress if still draft
    if (opname.status === "draft") {
      opname.status = "in_progress" as StockOpnameStatus;
      await this.stockOpnameRepo.save(opname);
    }
    return this.stockOpnameItemRepo.save(opnameItem);
  }

  /** Complete opname – reconcile differences, create corrections, adjust FIFO batches */
  async completeOpname(opnameId: string, userId: string): Promise<StockOpname> {
    return await AppDataSource.manager.transaction(async (tx) => {
      const opname = await tx.getRepository(StockOpname).findOne({
        where: { id: opnameId },
        relations: ["items", "items.item"],
      });
      if (!opname) throw new Error("Stock opname not found");
      if (opname.status === "completed")
        throw new Error("Opname already completed");

      // Check if there are any items with actual quantities filled
      const itemsWithActual = opname.items.filter(
        (item) => item.actualQty !== null && item.actualQty !== undefined
      );

      if (itemsWithActual.length === 0) {
        throw new Error(
          "Tidak ada item dengan kuantitas aktual yang diisi. Silakan isi kuantitas aktual terlebih dahulu."
        );
      }

      for (const opnameItem of opname.items) {
        // Skip items that don't have actual quantity filled
        if (
          opnameItem.actualQty === null ||
          opnameItem.actualQty === undefined
        ) {
          continue;
        }

        const diff = opnameItem.actualQty - opnameItem.systemQty;
        if (diff === 0) continue;

        const item = opnameItem.item;
        // update item stock
        item.currentStock = opnameItem.actualQty;
        await tx.getRepository(Item).save(item);

        // record a correction
        const correction = tx.getRepository(StockCorrection).create({
          itemId: item.id,
          adjustedQty: diff,
          reason: `Stock opname reconciliation (diff ${diff})`,
          createdBy: userId,
        });
        await tx.getRepository(StockCorrection).save(correction);

        // FIFO handling
        if (diff > 0) {
          // stock increased – create a new batch
          const batch = tx.getRepository(StockBatch).create({
            itemId: item.id,
            quantity: diff,
            receivedAt: new Date(),
          });
          await tx.getRepository(StockBatch).save(batch);
        } else {
          // stock decreased – consume from oldest batches
          let remaining = -diff; // positive quantity to deduct
          const batches = await tx
            .getRepository(StockBatch)
            .createQueryBuilder("batch")
            .where("batch.item_id = :itemId", { itemId: item.id })
            .andWhere("batch.quantity > 0")
            .orderBy("batch.received_at", "ASC")
            .getMany();
          for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.quantity, remaining);
            batch.quantity -= deduct;
            remaining -= deduct;
            await tx.getRepository(StockBatch).save(batch);
          }
          if (remaining > 0) {
            // should not happen if data is consistent, but guard against negative stock
            throw new Error(
              `Insufficient batch quantity for item ${item.id} during opname`
            );
          }
        }

        // create a stock movement record for audit trail
        const movement = tx.getRepository(StockMovement).create({
          itemId: item.id,
          movementType: "adjustment" as MovementType,
          quantity: Math.abs(diff),
          referenceType: "stock_opname",
          referenceId: opnameId,
          notes: `Opname adjustment, diff ${diff}`,
          createdBy: userId,
        });
        await tx.getRepository(StockMovement).save(movement);
      }

      opname.status = "completed" as StockOpnameStatus;
      opname.completedAt = new Date();
      return tx.getRepository(StockOpname).save(opname);
    });
  }

  /** Manual stock correction outside of opname */
  async correctStock(
    itemId: string,
    adjustedQty: number,
    reason: string,
    userId: string
  ): Promise<StockCorrection> {
    return await AppDataSource.manager.transaction(async (tx) => {
      const item = await tx
        .getRepository(Item)
        .findOne({ where: { id: itemId } });
      if (!item) throw new Error("Item not found");

      // apply adjustment
      item.currentStock += adjustedQty;
      await tx.getRepository(Item).save(item);

      // FIFO handling similar to completeOpname
      if (adjustedQty > 0) {
        const batch = tx.getRepository(StockBatch).create({
          itemId,
          quantity: adjustedQty,
          receivedAt: new Date(),
        });
        await tx.getRepository(StockBatch).save(batch);
      } else if (adjustedQty < 0) {
        let remaining = -adjustedQty;
        const batches = await tx
          .getRepository(StockBatch)
          .createQueryBuilder("batch")
          .where("batch.item_id = :itemId", { itemId })
          .andWhere("batch.quantity > 0")
          .orderBy("batch.received_at", "ASC")
          .getMany();
        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.quantity, remaining);
          batch.quantity -= deduct;
          remaining -= deduct;
          await tx.getRepository(StockBatch).save(batch);
        }
        if (remaining > 0) {
          throw new Error(`Insufficient batch quantity for item ${itemId}`);
        }
      }

      const correction = tx.getRepository(StockCorrection).create({
        itemId,
        adjustedQty,
        reason,
        createdBy: userId,
      });
      await tx.getRepository(StockCorrection).save(correction);

      const movement = tx.getRepository(StockMovement).create({
        itemId,
        movementType: "adjustment" as MovementType,
        quantity: Math.abs(adjustedQty),
        referenceType: "stock_correction",
        referenceId: correction.id,
        notes: reason,
        createdBy: userId,
      });
      await tx.getRepository(StockMovement).save(movement);

      return correction;
    });
  }

  /** Adjust stock IN – creates a new batch */
  async adjustIn(
    itemId: string,
    qty: number,
    notes: string,
    userId: string
  ): Promise<StockBatch> {
    if (qty <= 0) throw new Error("Quantity must be positive for adjustIn");
    return await AppDataSource.manager.transaction(async (tx) => {
      const item = await tx
        .getRepository(Item)
        .findOne({ where: { id: itemId } });
      if (!item) throw new Error("Item not found");
      item.currentStock += qty;
      await tx.getRepository(Item).save(item);

      const batch = tx.getRepository(StockBatch).create({
        itemId,
        quantity: qty,
        receivedAt: new Date(),
      });
      await tx.getRepository(StockBatch).save(batch);

      const movement = tx.getRepository(StockMovement).create({
        itemId,
        movementType: "in" as MovementType,
        quantity: qty,
        referenceType: "adjust_in",
        notes,
        createdBy: userId,
      });
      await tx.getRepository(StockMovement).save(movement);
      return batch;
    });
  }

  /** Adjust stock OUT – FIFO deduction */
  async adjustOut(
    itemId: string,
    qty: number,
    notes: string,
    userId: string
  ): Promise<void> {
    if (qty <= 0) throw new Error("Quantity must be positive for adjustOut");
    await AppDataSource.manager.transaction(async (tx) => {
      const item = await tx
        .getRepository(Item)
        .findOne({ where: { id: itemId } });
      if (!item) throw new Error("Item not found");
      if (item.currentStock < qty) {
        throw new Error("Insufficient stock for adjustOut");
      }
      item.currentStock -= qty;
      await tx.getRepository(Item).save(item);

      let remaining = qty;
      const batches = await tx
        .getRepository(StockBatch)
        .createQueryBuilder("batch")
        .where("batch.item_id = :itemId", { itemId })
        .andWhere("batch.quantity > 0")
        .orderBy("batch.received_at", "ASC")
        .getMany();
      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        batch.quantity -= deduct;
        remaining -= deduct;
        await tx.getRepository(StockBatch).save(batch);
      }
      if (remaining > 0) {
        throw new Error(`Insufficient batch quantity for item ${itemId}`);
      }

      const movement = tx.getRepository(StockMovement).create({
        itemId,
        movementType: "out" as MovementType,
        quantity: qty,
        referenceType: "adjust_out",
        notes,
        createdBy: userId,
      });
      await tx.getRepository(StockMovement).save(movement);
    });
  }
}
