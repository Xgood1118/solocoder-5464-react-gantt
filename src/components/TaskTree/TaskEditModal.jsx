import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { useResourceStore } from '../../stores/resourceStore'
import { useTaskStore } from '../../stores/taskStore'
import { useLinkStore } from '../../stores/linkStore'
import { useToastStore } from '../../stores/toastStore'
import {
  TASK_TYPE,
  TASK_PRIORITY,
  TASK_PRIORITY_LABEL,
  TASK_STATUS,
  TASK_STATUS_LABEL,
  DEPENDENCY_TYPE,
  DEPENDENCY_TYPE_LABEL
} from '../../constants'
import { dayjs } from '../../utils/dateUtils'

export default function TaskEditModal({ open, task, projectId, tasks, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    type: TASK_TYPE.TASK,
    startDate: '',
    endDate: '',
    progress: 0,
    priority: TASK_PRIORITY.MEDIUM,
    status: TASK_STATUS.NOT_STARTED,
    assigneeId: null,
    description: '',
    hoursPerDay: 8,
    resources: []
  })
  const [selectedPredecessors, setSelectedPredecessors] = useState([])

  const resources = useResourceStore((s) => s.getProjectResources(projectId))
  const getTaskResources = useTaskStore((s) => s.getTaskResources)
  const getProjectTasks = useTaskStore((s) => s.getProjectTasks)
  const getProjectLinks = useLinkStore((s) => s.getProjectLinks)
  const toast = useToastStore()

  useEffect(() => {
    if (!open) return
    if (task) {
      setForm({
        name: task.name || '',
        type: task.type || TASK_TYPE.TASK,
        startDate: task.startDate || dayjs().format('YYYY-MM-DD'),
        endDate: task.endDate || dayjs().add(3, 'day').format('YYYY-MM-DD'),
        progress: task.progress ?? 0,
        priority: task.priority || TASK_PRIORITY.MEDIUM,
        status: task.status || TASK_STATUS.NOT_STARTED,
        assigneeId: task.assigneeId || null,
        description: task.description || '',
        hoursPerDay: task.hoursPerDay || 8,
        resources: []
      })
      const taskRes = getTaskResources(task.id)
      if (taskRes) {
        setForm((f) => ({ ...f, resources: taskRes.map((r) => ({ ...r })) }))
      }
      const links = getProjectLinks(projectId)
      const preds = links.filter((l) => l.target === task.id).map((l) => ({ source: l.source, type: l.type, linkId: l.id }))
      setSelectedPredecessors(preds)
    } else {
      setForm({
        name: '',
        type: TASK_TYPE.TASK,
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        progress: 0,
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.NOT_STARTED,
        assigneeId: null,
        description: '',
        hoursPerDay: 8,
        resources: []
      })
      setSelectedPredecessors([])
    }
  }, [open, task, projectId])

  const checkStatusTransition = () => {
    if (!task || task.status === form.status) return { needWarn: false, message: '' }
    const oldStatus = task.status
    const newStatus = form.status

    const transitions = {
      [`${TASK_STATUS.NOT_STARTED}->${TASK_STATUS.COMPLETED}`]: '状态从"未开始"直接跳到"已完成"',
      [`${TASK_STATUS.COMPLETED}->${TASK_STATUS.NOT_STARTED}`]: '状态从"已完成"退回"未开始"',
      [`${TASK_STATUS.COMPLETED}->${TASK_STATUS.IN_PROGRESS}`]: '状态从"已完成"退回"进行中"',
      [`${TASK_STATUS.IN_PROGRESS}->${TASK_STATUS.NOT_STARTED}`]: '状态从"进行中"退回"未开始"',
      [`${TASK_STATUS.BLOCKED}->${TASK_STATUS.NOT_STARTED}`]: '状态从"已阻塞"退回"未开始"'
    }

    const key = `${oldStatus}->${newStatus}`
    if (transitions[key]) {
      return { needWarn: true, message: transitions[key] }
    }
    return { needWarn: false, message: '' }
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('请输入任务名称')
      return
    }
    if (form.type !== TASK_TYPE.MILESTONE && dayjs(form.endDate).isBefore(dayjs(form.startDate))) {
      toast.error('结束日期不能早于开始日期')
      return
    }

    const { needWarn, message } = checkStatusTransition()
    if (needWarn) {
      if (!confirm(`警告：${message}，是否确认？`)) {
        return
      }
    }

    const data = { ...form }
    if (form.type === TASK_TYPE.MILESTONE) {
      data.endDate = data.startDate
    }
    onSave(data, selectedPredecessors)
  }

  const handleAddResource = () => {
    if (!form.resources.some((r) => !r.resourceId)) {
      return
    }
    setForm({ ...form, resources: [...form.resources, { resourceId: '', units: 100 }] })
  }

  const handleRemoveResource = (idx) => {
    const newRes = [...form.resources]
    newRes.splice(idx, 1)
    setForm({ ...form, resources: newRes })
  }

  const handleResourceChange = (idx, field, value) => {
    const newRes = [...form.resources]
    newRes[idx] = { ...newRes[idx], [field]: value }
    setForm({ ...form, resources: newRes })
  }

  const handleAddPredecessor = () => {
    setSelectedPredecessors([...selectedPredecessors, { source: '', type: DEPENDENCY_TYPE.FS }])
  }

  const handleRemovePredecessor = (idx) => {
    const np = [...selectedPredecessors]
    np.splice(idx, 1)
    setSelectedPredecessors(np)
  }

  const handlePredecessorChange = (idx, field, value) => {
    const np = [...selectedPredecessors]
    np[idx] = { ...np[idx], [field]: value }
    setSelectedPredecessors(np)
  }

  const availableTasks = tasks.filter((t) => t.id !== task?.id)

  return (
    <Modal
      open={open}
      title={task ? '编辑任务' : '新建任务'}
      onClose={onClose}
      width={720}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-field">
          <label>任务名称</label>
          <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="请输入任务名称"
        />
        </div>
        <div className="form-field">
          <label>类型</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value={TASK_TYPE.TASK}>任务</option>
          <option value={TASK_TYPE.MILESTONE}>里程碑</option>
        </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>开始日期</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div className="form-field">
          <label>{form.type === TASK_TYPE.MILESTONE ? '里程碑日期' : '结束日期'}</label>
          <input
            type="date"
            value={form.type === TASK_TYPE.MILESTONE ? form.startDate : form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            disabled={form.type === TASK_TYPE.MILESTONE}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>进度 (%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={form.progress}
            onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) })}
          />
          <span style={{ fontSize: 12, color: '#6b7280' }}>{form.progress}%</span>
        </div>
        <div className="form-field">
          <label>优先级</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {Object.entries(TASK_PRIORITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label>负责人</label>
        <select
          value={form.assigneeId || ''}
          onChange={(e) => setForm({ ...form, assigneeId: e.target.value || null })}
        >
          <option value="">-- 未分配 --</option>
          {resources.filter((r) => r.type === 'person').map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label>描述</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="任务描述"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontWeight: 500, fontSize: 12, color: '#6b7280' }}>分配资源</label>
          <button className="btn-secondary" style={{ marginLeft: 8, fontSize: 11, padding: '3px 8px' }} onClick={handleAddResource}>+ 添加</button>
        </div>
        {form.resources.length === 0 && (
          <div style={{ padding: 8, background: '#f9fafb', borderRadius: 4, fontSize: 12, color: '#9ca3af' }}>
            暂无分配
          </div>
        )}
        {form.resources.map((r, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <select
              style={{ flex: 1 }}
              value={r.resourceId}
              onChange={(e) => handleResourceChange(idx, 'resourceId', e.target.value)}
            >
              <option value="">-- 选择资源 --</option>
              {resources.map((res) => (
                <option key={res.id} value={res.id}>{res.name} ({res.type === 'person' ? '人' : '设备'})</option>
              ))}
            </select>
            <input
              style={{ width: 100 }}
              type="number"
              min="1"
              max="100"
              value={r.units}
              onChange={(e) => handleResourceChange(idx, 'units', parseInt(e.target.value))}
            />
            <button
              className="btn-secondary"
              style={{ color: '#ef4444' }}
              onClick={() => handleRemoveResource(idx)}
            >×</button>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontWeight: 500, fontSize: 12, color: '#6b7280' }}>前置任务（依赖）</label>
          <button className="btn-secondary" style={{ marginLeft: 8, fontSize: 11, padding: '3px 8px' }} onClick={handleAddPredecessor}>+ 添加</button>
        </div>
        {selectedPredecessors.length === 0 && (
          <div style={{ padding: 8, background: '#f9fafb', borderRadius: 4, fontSize: 12, color: '#9ca3af' }}>
            暂无依赖
          </div>
        )}
        {selectedPredecessors.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <select
              style={{ flex: 1 }}
              value={p.source}
              onChange={(e) => handlePredecessorChange(idx, 'source', e.target.value)}
            >
              <option value="">-- 选择前置任务 --</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              style={{ width: 150 }}
              value={p.type}
              onChange={(e) => handlePredecessorChange(idx, 'type', e.target.value)}
            >
              {Object.entries(DEPENDENCY_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              className="btn-secondary"
              style={{ color: '#ef4444' }}
              onClick={() => handleRemovePredecessor(idx)}
            >×</button>
          </div>
        ))}
      </div>
    </Modal>
  )
}
