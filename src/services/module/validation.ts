
import { ModuleData } from "./types";

export const validateModule = (data: Partial<ModuleData>): boolean => {
  if (!data.name || data.name.trim().length === 0) {
    console.error('Module validation failed: name is required');
    return false;
  }

  if (!data.category) {
    console.error('Module validation failed: category is required');
    return false;
  }

  if (!data.dimensions) {
    console.error('Module validation failed: dimensions are required');
    return false;
  }

  const { length, width, height } = data.dimensions;
  if (length <= 0 || width <= 0 || height <= 0) {
    console.error('Module validation failed: invalid dimensions');
    return false;
  }

  return true;
};

export const validateCategory = (id: string, name: string): boolean => {
  if (!id || id.trim().length === 0) {
    console.error('Category validation failed: id is required');
    return false;
  }

  if (!name || name.trim().length === 0) {
    console.error('Category validation failed: name is required');
    return false;
  }

  return true;
};
