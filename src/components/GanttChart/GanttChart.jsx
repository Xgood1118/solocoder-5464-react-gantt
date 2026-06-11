import { useMemo, useRef, useState } from 'react'
import Toolbar from '../Toolbar/Toolbar'
import TaskTree from '../TaskTree/TaskTree'
import TaskEditModal from '../TaskTree/TaskEditModal'
import GanttTimeline from './GanttTimeline'
import GanttBar from './GanttBar'
import DependencyArrows from './DependencyArrows'
import ResourcePanel from '../ResourcePanel/ResourcePanel'
import BaselineDialog from '../BaselineOverlay/BaselineDialog'
import SettingsDialog from '../Settings/SettingsDialog'
import ExportDialog from '../ExportDialog/ExportDialog'
import ResourceView from '../ResourceView/ResourceView'
import { useGanttData } from '../../hooks/useGanttData'
import { useTimeline } from '../../hooks/useTimeline'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'
import { useLinkStore } from '../../stores/linkStore'
import { useResourceStore } from '../../stores/resourceStore'
import { useToastStore } from '../../stores/toastStore'
import { TASK_TYPE, DAY_WIDTH, ROW_HEIGHT, TASK_STATUS } from '../../constants'
import { dayjs, isWeekend } from '../../utils/dateUtils'
import { propagateDateChanges } from '../../utils/criticalPath'
import './GanttChart.css'

export default function GanttChart() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const addProject = useProjectStore((s) => s.addProject)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const updateTasksBatch = useTaskStore((s) => s.updateTasksBatch)
  const deleteLinksForTasks = useLinkStore((s) => s.deleteLinksForTasks) || (() => {})
  const addLink = useLinkStore((s) => s.addLink)
  const deleteLink = useLinkStore((s) => s.deleteLink)
  const getProjectLinks = useLinkStore((s) => s.getProjectLinks)
  const addResource = useResourceStore((s) => s.addResource)
  const getProjectResources = useResourceStore((s) => s.getProjectResources)
  const getProjectTasks = useTaskStore((s) => s.getProjectTasks)
  const getTaskTree = useTaskStore((s) => s.getTaskTree)
  const toast = useToastStore()

  const ganttRef = useRef(null)
  const scrollRef = useRef(null)
  const treeScrollRef = useRef(null)
  const syncingRef = useRef(null)

  const [view, setView] = useState('gantt')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [showResourcePanel, setShowResourcePanel] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editParentId, setEditParentId] = useState(null)
  const [baselineOpen, setBaselineOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedBaseline, setSelectedBaseline] = useState(null)
  const [draggingTaskId, setDraggingTaskId] = useState(null)

  const ganttData = useGanttData(activeProjectId)
  const {
    tasks,
    links,
    resources,
    resourceAssignments,
    collapsed,
    settings,
    criticalTasks,
    criticalPathColor,
    resourceLoad
  } = ganttData

  const flatTasks = useMemo(() => {
    if (!activeProjectId || tasks.length === 0) return []

    const buildTree = (parentId = null) => {
      return tasks
        .filter((t) => t.parentId === parentId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((t) => ({
          ...t,
          children: buildTree(t.id)
        }))
    }
    const tree = buildTree(null)

    const result = []
    const walk = (nodes, level) => {
      nodes.forEach((n) => {
        result.push({ ...n, level })
        if (!collapsed[n.id] && n.children && n.children.length > 0) {
          walk(n.children, level + 1)
        }
      })
    }
    walk(tree, 0)
    return result
  }, [tasks, activeProjectId, collapsed])

  const timeline = useTimeline(flatTasks)

  const handleAddTask = (type = TASK_TYPE.TASK, parentId = null) => {
    if (!activeProjectId) {
      toast.warning('请先选择或创建一个项目')
      return
    }
    setEditingTask(null)
    setEditParentId(parentId)
    setEditModalOpen(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setEditParentId(task.parentId)
    setEditModalOpen(true)
  }

  const handleAddChildTask = (parentTask) => {
    handleAddTask(TASK_TYPE.TASK, parentTask.id)
  }

  const handleSaveTask = (data, predecessors) => {
    const projectTasks = getProjectTasks(activeProjectId)

    if (editingTask) {
      updateTask(editingTask.id, data)
      const existingLinks = getProjectLinks(activeProjectId).filter((l) => l.target === editingTask.id)
      existingLinks.forEach((l) => deleteLink(l.id))
      predecessors.forEach((p) => {
        if (!p.source) return
        addLink({
          projectId: activeProjectId,
          source: p.source,
          target: editingTask.id,
          type: p.type
        }, projectTasks)
      })
      toast.success('任务已更新')
    } else {
      const created = addTask({
        ...data,
        projectId: activeProjectId,
        parentId: editParentId || null
      })
      predecessors.forEach((p) => {
        if (!p.source) return
        const latestTasks = getProjectTasks(activeProjectId)
        addLink({
          projectId: activeProjectId,
          source: p.source,
          target: created.id,
          type: p.type
        }, latestTasks)
      })
      toast.success('任务已创建')
    }
    setEditModalOpen(false)
    setEditingTask(null)
  }

  const handleAddResource = (data) => {
    addResource({ ...data, projectId: activeProjectId })
    toast.success('资源已创建')
  }

  const handleTaskBarDragStart = (taskId) => {
    setDraggingTaskId(taskId)
  }

  const handleTaskBarDragEnd = (taskId, dateData) => {
    if (!dateData.startDate || !dateData.endDate) return
    const projectTasks = getProjectTasks(activeProjectId)
    const projectLinks = getProjectLinks(activeProjectId)

    updateTask(taskId, dateData)

    const latestTasks = getProjectTasks(activeProjectId)
    const changed = propagateDateChanges(taskId, latestTasks, projectLinks, settings)

    if (changed && changed.size > 1) {
      const updates = []
      changed.forEach((task, id) => {
        if (id !== taskId) {
          updates.push({
            id,
            data: {
              startDate: task.startDate,
              endDate: task.endDate
            }
          })
        }
      })
      if (updates.length > 0) {
        updateTasksBatch(updates)
        toast.info(`已自动顺延 ${updates.length} 个关联任务`)
      }
    }

    setDraggingTaskId(null)
  }

  const handleSyncScroll = (e, source) => {
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      if (source === 'gantt') {
        if (treeScrollRef.current) {
          treeScrollRef.current.scrollTop = e.target.scrollTop
        }
      } else if (source === 'tree') {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = e.target.scrollTop
        }
      }
    } finally {
      requestAnimationFrame(() => {
        syncingRef.current = false
      })
    }
  }

  const todayOffset = timeline.getDayOffset(dayjs())

  const renderEmpty = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: '#6b7280',
        background: '#f9fafb'
      }}
    >
      <div style={{ fontSize: 48 }}>📊</div>
      <div style={{ fontSize: 16 }}>
        {activeProjectId ? '暂无任务，点击"+ 任务"开始创建' : '请先选择或创建一个项目'}
      </div>
      {!activeProjectId && (
        <button
          className="btn-primary"
          onClick={() => {
            addProject({ name: '我的第一个项目' })
            toast.success('项目已创建')
          }}
        >
          创建示例项目
        </button>
      )}
    </div>
  )

  return (
    <div className="gantt-container">
      <Toolbar
        view={view}
        onViewChange={setView}
        onAddTask={() => handleAddTask(TASK_TYPE.TASK)}
        onAddMilestone={() => handleAddTask(TASK_TYPE.MILESTONE)}
        onAddResource={() => handleAddResource({ name: '新资源' })}
        onOpenExport={() => setExportOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBaseline={() => setBaselineOpen(true)}
        onShowResourcePanel={() => setShowResourcePanel(!showResourcePanel)}
        showResourcePanel={showResourcePanel}
      />

      {view === 'resource' ? (
        <ResourceView
          projectId={activeProjectId}
          tasks={tasks}
          resources={resources}
          resourceAssignments={resourceAssignments}
          resourceLoad={resourceLoad}
          settings={settings}
        />
      ) : (
        <div className="gantt-chart">
          <TaskTree
            projectId={activeProjectId}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            onEditTask={handleEditTask}
            onAddChildTask={handleAddChildTask}
            onDeleteTask={(t) => {
              deleteLinksForTasks([t.id])
            }}
          />

          {flatTasks.length === 0 ? (
            renderEmpty()
          ) : (
            <div className="gantt-main" ref={ganttRef}>
              <div
                style={{
                  overflow: 'hidden',
                  flexShrink: 0,
                  borderBottom: '1px solid #e5e7eb'
                }}
                ref={(el) => {
                  if (el && scrollRef.current) {
                    el.scrollLeft = scrollRef.current.scrollLeft
                  }
                }}
              >
                <GanttTimeline days={timeline.days} totalWidth={timeline.totalWidth} />
              </div>

              <div
                className="gantt-scroll"
                ref={scrollRef}
                onScroll={(e) => handleSyncScroll(e, 'gantt')}
              >
                <div style={{ position: 'relative', width: timeline.totalWidth }}>
                  <div className="gantt-grid" style={{ height: flatTasks.length * ROW_HEIGHT }}>
                    {timeline.days.map((d, idx) => {
                      const weekend = isWeekend(d)
                      return (
                        <div
                          key={idx}
                          className={`grid-line ${weekend ? 'weekend' : ''}`}
                          style={{ left: idx * DAY_WIDTH }}
                        />
                      )
                    })}
                    {todayOffset >= 0 && (
                      <div className="today-line" style={{ left: todayOffset + DAY_WIDTH / 2 }} />
                    )}
                  </div>

                  {flatTasks.map((task, rowIdx) => (
                    <div
                      key={task.id}
                      className={`gantt-row ${selectedTaskId === task.id ? 'selected' : ''}`}
                      style={{ height: ROW_HEIGHT, top: rowIdx * ROW_HEIGHT, position: 'absolute', width: timeline.totalWidth }}
                      onClick={() => setSelectedTaskId(task.id)}
                      onDoubleClick={() => handleEditTask(task)}
                    >
                      <GanttBar
                        task={task}
                        left={timeline.getDayOffset(task.startDate)}
                        width={Math.max(
                          DAY_WIDTH * Math.max(
                            1,
                            dayjs(task.endDate).diff(dayjs(task.startDate), 'day') + 1
                          ),
                          task.type === TASK_TYPE.MILESTONE ? 0 : 4
                        )}
                        rowHeight={ROW_HEIGHT}
                        isCritical={criticalTasks?.has(task.id)}
                        isSelected={selectedTaskId === task.id}
                        criticalPathColor={criticalPathColor}
                        onDragStart={handleTaskBarDragStart}
                        onDragEnd={handleTaskBarDragEnd}
                        onClick={setSelectedTaskId}
                        onDoubleClick={handleEditTask}
                        getDayOffset={timeline.getDayOffset}
                        startDate={timeline.startDate}
                      />
                    </div>
                  ))}

                  <DependencyArrows
                    links={links}
                    tasks={flatTasks}
                    getDayOffset={timeline.getDayOffset}
                    rowHeight={ROW_HEIGHT}
                    dayWidth={DAY_WIDTH}
                  />
                </div>
              </div>
            </div>
          )}

          {showResourcePanel && activeProjectId && (
            <ResourcePanel
              projectId={activeProjectId}
              resourceLoad={resourceLoad}
              onAddResource={handleAddResource}
            />
          )}
        </div>
      )}

      <TaskEditModal
        open={editModalOpen}
        task={editingTask}
        projectId={activeProjectId}
        tasks={tasks}
        onClose={() => { setEditModalOpen(false); setEditingTask(null) }}
        onSave={handleSaveTask}
      />

      <BaselineDialog
        open={baselineOpen}
        projectId={activeProjectId}
        onClose={() => setBaselineOpen(false)}
        onSelectBaseline={(b) => {
          setSelectedBaseline(b)
          toast.info(`已选择基线：${b.name}`)
          setBaselineOpen(false)
        }}
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <ExportDialog
        open={exportOpen}
        projectId={activeProjectId}
        ganttRef={ganttRef}
        onClose={() => setExportOpen(false)}
      />
    </div>
  )
}
