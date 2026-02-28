import { CrudRepository } from '@massapp/storage';
import { db } from './database';

export interface Item {
  id?: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const itemRepository = new CrudRepository<Item>(
  db,
  'items',
  ['id', 'title', 'description', 'created_at', 'updated_at']
);
