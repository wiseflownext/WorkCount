import { create } from 'zustand';
import { Product } from '../lib/types';
import * as productService from '../services/product.service';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  fetchProducts: (activeOnly?: boolean) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>, changedBy?: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,

  fetchProducts: async (activeOnly = true) => {
    set({ isLoading: true });
    try {
      const products = activeOnly
        ? await productService.getActiveProducts()
        : await productService.getAllProducts();
      set({ products, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addProduct: async (product) => {
    const created = await productService.createProduct(product);
    set((s) => ({ products: [created, ...s.products] }));
  },

  updateProduct: async (id, updates, changedBy) => {
    const updated = await productService.updateProduct(id, updates, changedBy);
    set((s) => ({ products: s.products.map((p) => (p.id === id ? updated : p)) }));
  },
}));
