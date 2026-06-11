import { useMemo, useState } from 'react'
import Modal from '../common/Modal'
import { useResourceStore } from '../../stores/resourceStore'
import { useToastStore } from '../../stores/toastStore'
import { RESOURCE_TYPE, RESOURCE_TYPE_LABEL, DEFAULT_SETTINGS } from '../../constants'
import { dayjs } from '../../utils/dateUtils'
import './ResourcePanel.css'

function ResourceEditModal({ open, resource, projectId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    type: RESOURCE_TYPE.PERSON,
    dailyCapacity: DEFAULT_SETTINGS.workingHoursPerDay,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
    email: ''
  })
  const toast = useToastStore()

  useState(() => {
    if (resource) {
      setForm({
        name: resource.name,
        type: resource.type,
        dailyCapacity: resource.dailyCapacity,
        color: resource.color,
        email: resource.email || ''
      })
    }
  }, [open, resource])

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('请输入资源名称')
      return
    }
    onSave(form)
  }

  return (
    <Modal
      open={open}
      title={resource ? '编辑资源' : '新建资源'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-field">
          <label>资源名称</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="例如：张三、开发服务器"
          />
        </div>
        <div className="form-field">
          <label>类型</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {Object.entries(RESOURCE_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>日可用工时（小时）</label>
          <input
            type="number"
            min="1"
            max="24"
            value={form.dailyCapacity}
            onChange={(e) => setForm({ ...form, dailyCapacity: parseFloat(e.target.value) })}
          />
        </div>
        <div className="form-field">
          <label>颜色标记</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            style={{ height: 34, padding: 2 }}
          />
        </div>
      </div>
      <div className="form-field">
        <label>邮箱（可选）</label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="用于联系"
        />
      </div>
    </Modal>
  )
}

export default function ResourcePanel({
  projectId,
  resourceLoad,
  onAddResource
}) {
  const resources = useResourceStore((s) => s.getProjectResources(projectId))
  const updateResource = useResourceStore((s) => s.updateResource)
  const deleteResource = useResourceStore((s) => s.deleteResource)
  const toast = useToastStore()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)

  const avgLoad = useMemo(() => {
    const result = new Map()
    resourceLoad?.forEach((dayMap, resourceId) => {
      const entries = Object.values(dayMap)
      if (entries.length === 0) {
        result.set(resourceId, 0)
      } else {
        const avg = entries.reduce((sum, e) => sum + e.loadPercent, 0) / entries.length
        result.set(resourceId, Math.round(avg))
      }
    })
    return result
  }, [resourceLoad])

  const handleEdit = (r) => {
    setEditingResource(r)
    setEditModalOpen(true)
  }

  const handleDelete = (r) => {
    if (!confirm(`确定要删除资源"${r.name}"吗？`)) return
    deleteResource(r.id)
    toast.success('资源已删除')
  }

  const handleSave = (data) => {
    if (editingResource) {
      updateResource(editingResource.id, data)
      toast.success('资源已更新')
    } else {
      onAddResource?.(data)
    }
    setEditModalOpen(false)
    setEditingResource(null)
  }

  const handleNew = () => {
    setEditingResource(null)
    setEditModalOpen(true)
  }

  return (
    <div className="resource-panel">
      <div className="resource-panel-header">
        资源管理
        <button
          className="btn-primary"
          style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 12 }}
          onClick={handleNew}
        >+ 添加</button>
      </div>
      <div className="resource-panel-body">
        {resources.length === 0 ? (
          <div className="resource-empty">
            暂无资源<br />
            点击"+ 添加"创建资源
          </div>
        ) : (
          resources.map((r) => {
            const load = avgLoad.get(r.id) || 0
            let loadClass = 'normal'
            if (load > 100) loadClass = 'overload'
            else if (load > 85) loadClass = 'warning'

            return (
              <div key={r.id} className="resource-card">
                <div className="resource-card-header">
                  <div className="resource-color-dot" style={{ background: r.color }} />
                  <span className="resource-name">{r.name}</span>
                  <span className="resource-type">{RESOURCE_TYPE_LABEL[r.type]}</span>
                </div>
                <div className="resource-info">
                  日可用：{r.dailyCapacity}h
                  {r.email && <span> · {r.email}</span>}
                </div>
                <div className="resource-load-bar">
                  <div
                    className={`resource-load-fill ${loadClass}`}
                    style={{ width: Math.min(load, 100) + '%' }}
                  />
                </div>
                <div className="resource-load-text">
                  平均负荷：{load}%
                  {load > 100 && <span style={{ color: '#ef4444', fontWeight: 600 }}> ⚠ 超载</span>}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '2px 8px', fontSize: 11, flex: 1 }}
                    onClick={() => handleEdit(r)}
                  >编辑</button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '2px 8px', fontSize: 11, flex: 1, color: '#ef4444' }}
                    onClick={() => handleDelete(r)}
                  >删除</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <ResourceEditModal
        open={editModalOpen}
        resource={editingResource}
        projectId={projectId}
        onClose={() => { setEditModalOpen(false); setEditingResource(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
