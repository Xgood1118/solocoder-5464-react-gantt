export const SCHEMA_VERSION = '1.0.0'

export const STORAGE_KEYS = {
  PROJECTS: 'gantt_projects',
  TASKS: 'gantt_tasks',
  LINKS: 'gantt_links',
  RESOURCES: 'gantt_resources',
  BASELINES: 'gantt_baselines',
  SETTINGS: 'gantt_settings',
  COLLAPSED: 'gantt_collapsed',
  ACTIVE_PROJECT: 'gantt_active_project'
}

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

export const TASK_PRIORITY_LABEL = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

export const TASK_PRIORITY_COLOR = {
  low: '#9ca3af',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
}

export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked'
}

export const TASK_STATUS_LABEL = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  blocked: '已阻塞'
}

export const TASK_STATUS_COLOR = {
  not_started: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#10b981',
  blocked: '#ef4444'
}

export const TASK_TYPE = {
  TASK: 'task',
  MILESTONE: 'milestone'
}

export const DEPENDENCY_TYPE = {
  FS: 'FS',
  SS: 'SS',
  FF: 'FF',
  SF: 'SF'
}

export const DEPENDENCY_TYPE_LABEL = {
  FS: '完成-开始(FS)',
  SS: '开始-开始(SS)',
  FF: '完成-完成(FF)',
  SF: '开始-完成(SF)'
}

export const RESOURCE_TYPE = {
  PERSON: 'person',
  EQUIPMENT: 'equipment'
}

export const RESOURCE_TYPE_LABEL = {
  person: '人员',
  equipment: '设备'
}

export const DAY_WIDTH = 40
export const ROW_HEIGHT = 40
export const TREE_WIDTH = 320
export const HEADER_HEIGHT = 60

export const DEFAULT_SETTINGS = {
  excludeWeekends: true,
  baselineDeviationDays: 2,
  criticalPathColor: '#ef4444',
  workingHoursPerDay: 8
}
