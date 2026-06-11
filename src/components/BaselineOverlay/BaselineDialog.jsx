import { useState } from 'react'
import Modal from '../common/Modal'
import { useBaselineStore } from '../../stores/baselineStore'
import { useTaskStore } from '../../stores/taskStore'
import { useLinkStore } from '../../stores/linkStore'
import { useToastStore } from '../../stores/toastStore'
import { dayjs } from '../../utils/dateUtils'

export default function BaselineDialog({ open, projectId, onClose, onSelectBaseline }) {
  const baselines = useBaselineStore((s) => s.getProjectBaselines(projectId))
  const createBaseline = useBaselineStore((s) => s.createBaseline)
  const deleteBaseline = useBaselineStore((s) => s.deleteBaseline)
  const getProjectTasks = useTaskStore((s) => s.getProjectTasks)
  const getProjectLinks = useLinkStore((s) => s.getProjectLinks)
  const toast = useToastStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('请输入基线名称')
      return
    }
    const tasks = getProjectTasks(projectId)
    const links = getProjectLinks(projectId)
    createBaseline({
      projectId,
      name,
      description,
      tasksSnapshot: JSON.parse(JSON.stringify(tasks)),
      linksSnapshot: JSON.parse(JSON.stringify(links))
    })
    toast.success('基线已创建')
    setName('')
    setDescription('')
  }

  const handleDelete = (id) => {
    if (!confirm('确定要删除此基线吗？')) return
    deleteBaseline(id)
    toast.success('基线已删除')
  }

  return (
    <Modal
      open={open}
      title="基线管理"
      onClose={onClose}
      width={600}
    >
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 10, fontSize: 13 }}>创建新基线</h4>
        <div className="form-field" style={{ marginBottom: 8 }}>
          <label>基线名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：V1.0 计划"
          />
        </div>
        <div className="form-field" style={{ marginBottom: 8 }}>
          <label>描述（可选）</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="基线说明"
          />
        </div>
        <button className="btn-primary" onClick={handleCreate}>创建基线快照</button>
      </div>

      <div>
        <h4 style={{ marginBottom: 10, fontSize: 13 }}>已有基线</h4>
        {baselines.length === 0 ? (
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 6, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
            暂无基线
          </div>
        ) : (
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {baselines.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: 10,
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {dayjs(b.createdAt).format('YYYY-MM-DD HH:mm')} · {b.tasksSnapshot?.length || 0} 个任务
                  </div>
                  {b.description && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {b.description}
                    </div>
                  )}
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => onSelectBaseline?.(b)}
                >对比</button>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: 12, color: '#ef4444' }}
                  onClick={() => handleDelete(b.id)}
                >删除</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
