
import { ProjectValidation } from "./types";

export const validateProject = (data: Partial<ProjectValidation>): boolean => {
  if (!data.name || data.name.trim().length === 0) {
    console.error('Project validation failed: name is required');
    return false;
  }
  if (data.clientEmail && !data.clientEmail.includes('@')) {
    console.error('Project validation failed: invalid email format');
    return false;
  }
  if (data.plotWidth && (data.plotWidth <= 0 || data.plotWidth > 1000)) {
    console.error('Project validation failed: invalid plot width');
    return false;
  }
  if (data.plotLength && (data.plotLength <= 0 || data.plotLength > 1000)) {
    console.error('Project validation failed: invalid plot length');
    return false;
  }
  return true;
};
