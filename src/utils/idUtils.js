import { v4 as uuidv4 } from 'uuid'

export const generateId = (prefix = '') => {
  return `${prefix}${uuidv4().replace(/-/g, '').slice(0, 12)}`
}

export const generateTaskId = () => generateId('T')
export const generateLinkId = () => generateId('L')
export const generateProjectId = () => generateId('P')
export const generateResourceId = () => generateId('R')
export const generateBaselineId = () => generateId('B')
