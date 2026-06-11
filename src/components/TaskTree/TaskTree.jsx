import { useState, useMemo } from 'react'
import { useTaskStore } from '../../stores/taskStore'
import { useToastStore } from '../../stores/toastStore'
import {
  TASK_TYPE,
  TASK_STATUS,
  TASK_STATUS_COLOR,
  TASK_PRIORITY_COLOR,
  TASK_PRIORITY_LABEL
} from '../../constants'
import { formatDate } from '../../utils/dateUtils'
import './TaskTree.css'

function TaskNode({ task, level, selectedId, onSelect, onEdit, onAddChild, onDelete, children, collapsed, onToggle }) {
  const hasChildren = children && children.length > 0
  const isCollapsed = collapsed[task.id]
  const statusColor = TASK_STATUS_COLOR[task.status]
  const priorityColor = TASK_PRIORITY_COLOR[task.priority]

  return (
    <>
      <div
        className={`task-node ${selectedId === task.id ? 'selected' : ''}`}
        onClick={() => onSelect(task.id)}
        onDoubleClick={() => onEdit(task)}
        style={{ paddingLeft: level * 16 + 8 }}
      >
        <div className="task-toggle has-children" onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}>
          {hasChildren ? (isCollapsed ? '▶' : '▼') : '·'}
        </div>
        <div className="task-status-dot" style={{ background: statusColor }} title={`状态：${task.status}`} />
        {task.type === TASK_TYPE.MILESTONE ? (
          <span style={{ color: '#7c3aed', marginRight: 4 }}>◆</span>
        ) : null}
        <div className={`task-name ${task.type === TASK_TYPE.MILESTONE ? 'milestone' : ''}`}>
          {task.name}
        </div>
        <div className="task-progress">{task.progress}%</div>
        <div className="task-actions">
          <button
            className="btn-secondary"
            title="添加子任务"
            onClick={(e) => { e.stopPropagation(); onAddChild(task) }}
          >+</button>
          <button
            className="btn-secondary"
            title="编辑"
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
          >✎</button>
          <button
            className="btn-secondary"
            title="删除"
            style={{ color: '#ef4444' }}
            onClick={(e) => { e.stopPropagation(); onDelete(task) }}
          >×</button>
        </div>
      </div>
      {hasChildren && !isCollapsed && children.map((child) => (
        <TaskNode
          key={child.id}
          task={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          children={child.children}
          collapsed={collapsed}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}

export default function TaskTree({
  projectId,
  selectedTaskId,
  onSelectTask,
  onEditTask,
  onAddChildTask,
  onDeleteTask
}) {
  const getTaskTree = useTaskStore((s) => s.getTaskTree)
  const collapsed = useTaskStore((s) => s.collapsed)
  const toggleCollapse = useTaskStore((s) => s.toggleCollapse)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const deleteLinksForTasks = useTaskStore((s) => s.deleteLinksForTasks) || (() => {})
  const toast = useToastStore()

  const tree = useMemo(() => getTaskTree(projectId), [getTaskTree, projectId])

  const handleDelete = (task) => {
    if (!confirm(`确定要删除任务"${task.name}"及其所有子任务吗？`)) return
    const deletedIds = deleteTask(task.id)
    toast.success('任务已删除')
  }

  return (
    <div className="task-tree">
      <div className="task-tree-header">
        任务列表
        {selectedTaskId && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
            已选 {tree.length} 根任务
          </span>
        )}
      </div>
      <div className="task-tree-body">
        {tree.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            暂无任务，点击"+ 任务"按钮添加
          </div>
        ) : (
          tree.map((task) => (
            <TaskNode
              key={task.id}
              task={task}
              level={0}
              selectedId={selectedTaskId}
              onSelect={onSelectTask}
              onEdit={onEditTask}
              onAddChild={onAddChildTask}
              onDelete={handleDelete}
              children={task.children}
              collapsed={collapsed}
              onToggle={toggleCollapse}
            />
          ))
        )}
      </div>
    </div>
  )
}
