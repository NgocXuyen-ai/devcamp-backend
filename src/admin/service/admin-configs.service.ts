import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import {
  AdminConfig,
  AdminConfigDocument,
} from '../schema/admin-config.schema';

@Injectable()
export class AdminConfigService {
  private readonly cache = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(
    @InjectModel(AdminConfig.name)
    private readonly model: Model<AdminConfigDocument>,
  ) {}

  // ----- read -----

  async list(filter: { scope?: string; isActive?: boolean }) {
    const q: QueryFilter<AdminConfigDocument> = {};
    if (filter.scope) q.scope = filter.scope;
    if (filter.isActive !== undefined) q.isActive = filter.isActive;
    return this.model.find(q).sort({ scope: 1, key: 1 });
  }

  async findOne(scope: string, key: string): Promise<AdminConfigDocument> {
    const doc = await this.model.findOne({ scope, key });
    if (!doc) throw new NotFoundException(`Config ${scope}.${key} not found`);
    return doc;
  }

  /**
   * Typed getter for consumer services.
   * Returns `defaultValue` if config is missing or inactive.
   */
  async getValue<T>(scope: string, key: string, defaultValue: T): Promise<T> {
    const cacheKey = `${scope}.${key}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }
    const doc = await this.model.findOne({ scope, key, isActive: true });
    const value = (doc?.value as T) ?? defaultValue;
    this.cache.set(cacheKey, { value, expiresAt: now + this.CACHE_TTL_MS });
    return value;
  }

  /** Convenience: returns the entire active map for a scope. */
  async getScopeMap(scope: string): Promise<Record<string, unknown>> {
    const docs = await this.model.find({ scope, isActive: true });
    return Object.fromEntries(
      docs.map((d: AdminConfigDocument) => [d.key, d.value]),
    );
  }

  // ----- write -----

  async upsert(
    scope: string,
    key: string,
    payload: {
      value: unknown;
      description?: string;
      isActive?: boolean;
      updatedBy?: Types.ObjectId;
    },
  ): Promise<AdminConfigDocument> {
    const existing = await this.model.findOne({ scope, key });
    const next = existing
      ? await this.model.findOneAndUpdate(
          { _id: existing._id },
          {
            $set: {
              value: payload.value,
              description: payload.description ?? existing.description,
              isActive: payload.isActive ?? existing.isActive,
              updatedBy: payload.updatedBy,
            },
            $inc: { version: 1 },
          },
          { new: true },
        )
      : await this.model.create({
          scope,
          key,
          value: payload.value as AdminConfig['value'],
          description: payload.description,
          isActive: payload.isActive ?? true,
          updatedBy: payload.updatedBy,
          version: 1,
        });

    // Invalidate cache
    this.cache.delete(`${scope}.${key}`);
    if (!next) throw new NotFoundException('Config update failed');
    return next;
  }

  async remove(scope: string, key: string): Promise<void> {
    const res = await this.model.deleteOne({ scope, key });
    if (res.deletedCount === 0) {
      throw new NotFoundException(`Config ${scope}.${key} not found`);
    }
    this.cache.delete(`${scope}.${key}`);
  }
}
