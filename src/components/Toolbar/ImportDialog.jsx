import { useState, useRef } from 'react'
import Modal from '../common/Modal'
import { useToastStore } from '../../stores/toastStore'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'
import { useLinkStore } from '../../stores/linkStore'
import { useResourceStore } from '../../stores/resourceStore'
import { useBaselineStore } from '../../stores/baselineStore'
import { SCHEMA_VERSION } from '../../constants'

export default function ImportDialog({ open, onClose }) {
  const [data, setData] = useState('')
  const fileInput = useRef(null)
  const toast = useToastStore()
  const importProjects = useProjectStore((s) => s.importProjects)
  const importTasks = useTaskStore((s) => s.importTasks)
  const importLinks = useLinkStore((s) => s.importLinks)
  const importResources = useResourceStore((s) => s.importResources)
  const importBaselines = useBaselineStore((s) => s.importBaselines)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setData(evt.target.result)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        toast.error(`版本不兼容：当前版本 ${SCHEMA_VERSION}，导入版本 ${parsed.schemaVersion}`)
        return
      }
      if (parsed.projects) importProjects(parsed.projects, parsed.activeProjectId)
      if (parsed.tasks) importTasks(parsed.tasks, parsed.resourceAssignments || [], parsed.collapsed || {})
      if (parsed.links) importLinks(parsed.links)
      if (parsed.resources) importResources(parsed.resources)
      if (parsed.baselines) importBaselines(parsed.baselines)
      toast.success('导入成功')
      setData('')
      onClose()
    } catch (err) {
      toast.error('导入失败：' + err.message)
    }
  }

  const handleExportJson = () => {
    const exportData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      projects: useProjectStore.getState().projects,
      activeProjectId: useProjectStore.getState().activeProjectId,
      tasks: useTaskStore.getState().tasks,
      resourceAssignments: useTaskStore.getState().resourceAssignments,
      collapsed: useTaskStore.getState().collapsed,
      links: useLinkStore.getState().links,
      resources: useResourceStore.getState().resources,
      baselines: useBaselineStore.getState().baselines
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gantt-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('JSON 已导出')
  }

  return (
    <Modal
      open={open}
      title="数据导入/导出 (调试入口)"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={handleExportJson}>导出 JSON</button>
          <button className="btn-secondary" onClick={onClose}>关闭</button>
          <button className="btn-primary" onClick={handleImport}>导入</button>
        </>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <input ref={fileInput} type="file" accept=".json" onChange={handleFileSelect} style={{ marginBottom: 12 }} />
      </div>
      <div className="form-field">
        <label>或粘贴 JSON 数据</label>
        <textarea
          value={data}
          onChange={(e) => setData(e.target.value)}
          rows={12}
          placeholder='{"schemaVersion":"1.0.0","projects":[...],...}'
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
      <div style={{ marginTop: 12, padding: 12, background: '#fef3c7', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
        Schema 版本：{SCHEMA_VERSION}，导入数据版本必须一致
      </div>
    </Modal>
  )
}
