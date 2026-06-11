import { useState, useRef } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useToastStore } from '../../stores/toastStore'
import Modal from '../common/Modal'
import ImportDialog from './ImportDialog'
import './Toolbar.css'

export default function Toolbar({
  view,
  onViewChange,
  onAddTask,
  onAddMilestone,
  onAddResource,
  onOpenExport,
  onOpenSettings,
  onOpenBaseline,
  onShowResourcePanel,
  showResourcePanel
}) {
  const projects = useProjectStore((s) => s.projects)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const addProject = useProjectStore((s) => s.addProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const toast = useToastStore()

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [projectForm, setProjectForm] = useState({ name: '', startDate: '', endDate: '', description: '' })
  const [importOpen, setImportOpen] = useState(false)

  const longPressTimer = useRef(null)
  const logoRef = useRef(null)

  const handleLogoMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setImportOpen(true)
      toast.info('隐藏入口已激活：数据导入')
    }, 5000)
  }

  const handleLogoMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleAddProject = () => {
    setEditingProject(null)
    setProjectForm({ name: '', startDate: '', endDate: '', description: '' })
    setProjectModalOpen(true)
  }

  const handleEditProject = () => {
    const p = projects.find((x) => x.id === activeProjectId)
    if (!p) return
    setEditingProject(p)
    setProjectForm({
      name: p.name,
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      description: p.description || ''
    })
    setProjectModalOpen(true)
  }

  const handleDeleteProject = () => {
    if (!activeProjectId) return
    if (!confirm('确定要删除当前项目吗？')) return
    deleteProject(activeProjectId)
    toast.success('项目已删除')
  }

  const handleSaveProject = () => {
    if (!projectForm.name.trim()) {
      toast.error('请输入项目名称')
      return
    }
    if (editingProject) {
      updateProject(editingProject.id, projectForm)
      toast.success('项目已更新')
    } else {
      addProject(projectForm)
      toast.success('项目已创建')
    }
    setProjectModalOpen(false)
  }

  return (
    <div className="gantt-toolbar">
      <div
        className="logo"
        ref={logoRef}
        onMouseDown={handleLogoMouseDown}
        onMouseUp={handleLogoMouseUp}
        onMouseLeave={handleLogoMouseUp}
      >
        <div className="logo-icon">G</div>
        <span>GanttTool</span>
      </div>

      <div className="divider" />

      <div className="project-selector">
        <select
          value={activeProjectId || ''}
          onChange={(e) => setActiveProject(e.target.value || null)}
          style={{ minWidth: 180 }}
        >
          <option value="">-- 选择项目 --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className="btn-secondary" onClick={handleAddProject} title="新建项目">+ 项目</button>
        {activeProjectId && (
          <>
            <button className="btn-secondary" onClick={handleEditProject} title="编辑项目">编辑</button>
            <button className="btn-secondary" onClick={handleDeleteProject} title="删除项目" style={{ color: '#ef4444' }}>删除</button>
          </>
        )}
      </div>

      <div className="divider" />

      {activeProjectId && (
        <>
          <button className="btn-primary" onClick={onAddTask}>+ 任务</button>
          <button className="btn-secondary" onClick={onAddMilestone}>◆ 里程碑</button>
          <button className="btn-secondary" onClick={onAddResource}>👤 资源</button>
          <button className="btn-secondary" onClick={onOpenBaseline}>📋 基线</button>
        </>
      )}

      <div className="toolbar-right">
        <div className="view-toggle">
          <button className={view === 'gantt' ? 'active' : ''} onClick={() => onViewChange('gantt')}>甘特图</button>
          <button
            className={view === 'resource' ? 'active' : ''}
            onClick={() => onViewChange('resource')}
          >
            资源视图
          </button>
        </div>
        {activeProjectId && (
          <button className="btn-secondary" onClick={onShowResourcePanel}>
            {showResourcePanel ? '隐藏资源' : '显示资源'}
          </button>
        )}
        <button className="btn-secondary" onClick={onOpenSettings}>⚙ 设置</button>
        {activeProjectId && <button className="btn-success" onClick={onOpenExport}>导出</button>}
      </div>

      <Modal
        open={projectModalOpen}
        title={editingProject ? '编辑项目' : '新建项目'}
        onClose={() => setProjectModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setProjectModalOpen(false)}>取消</button>
            <button className="btn-primary" onClick={handleSaveProject}>保存</button>
          </>
        }
      >
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label>项目名称</label>
          <input
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            placeholder="请输入项目名称"
          />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>开始日期</label>
            <input
              type="date"
              value={projectForm.startDate}
              onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>结束日期</label>
            <input
              type="date"
              value={projectForm.endDate}
              onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="form-field" style={{ marginTop: 12 }}>
          <label>描述</label>
          <textarea
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            rows={3}
            placeholder="项目描述"
          />
        </div>
      </Modal>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
