import { useState } from 'react'
import Modal from '../common/Modal'
import { useToastStore } from '../../stores/toastStore'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskStore } from '../../stores/taskStore'
import { useLinkStore } from '../../stores/linkStore'
import { useResourceStore } from '../../stores/resourceStore'
import { useBaselineStore } from '../../stores/baselineStore'
import { SCHEMA_VERSION, TASK_PRIORITY_LABEL, TASK_STATUS_LABEL, TASK_TYPE, DEPENDENCY_TYPE_LABEL, RESOURCE_TYPE_LABEL } from '../../constants'
import { dayjs, formatDate } from '../../utils/dateUtils'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function ExportDialog({ open, projectId, ganttRef, onClose }) {
  const [exportType, setExportType] = useState('pdf')
  const [rangeType, setRangeType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const toast = useToastStore()

  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.getProjectTasks(projectId))
  const links = useLinkStore((s) => s.getProjectLinks(projectId))
  const resources = useResourceStore((s) => s.getProjectResources(projectId))
  const resourceAssignments = useTaskStore((s) => s.resourceAssignments)
  const project = projects.find((p) => p.id === projectId)

  const handleExport = async () => {
    try {
      if (exportType === 'json') {
        await exportJson()
      } else if (exportType === 'excel') {
        await exportExcel()
      } else if (exportType === 'pdf') {
        await exportPdf()
      } else if (exportType === 'mpx') {
        await exportMpx()
      }
      onClose()
    } catch (err) {
      toast.error('导出失败：' + err.message)
    }
  }

  const exportJson = () => {
    const exportData = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      projects: projects.filter((p) => p.id === projectId),
      activeProjectId: projectId,
      tasks,
      resourceAssignments: resourceAssignments.filter((a) => tasks.some((t) => t.id === a.taskId)),
      collapsed: useTaskStore.getState().collapsed,
      links,
      resources,
      baselines: useBaselineStore.getState().baselines.filter((b) => b.projectId === projectId)
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${project?.name || 'gantt'}-${dayjs().format('YYYYMMDD')}.json`)
    toast.success('JSON 已导出')
  }

  const exportExcel = () => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]))
    const resourceMap = new Map(resources.map((r) => [r.id, r]))

    const taskRows = tasks.map((t) => {
      const preds = links.filter((l) => l.target === t.id).map((l) => {
        const src = taskMap.get(l.source)
        return src ? `${src.name}(${l.type})` : l.source
      })
      const taskRes = resourceAssignments
        .filter((a) => a.taskId === t.id)
        .map((a) => {
          const r = resourceMap.get(a.resourceId)
          return r ? `${r.name}(${a.units}%)` : a.resourceId
        })
      return {
        'ID': t.id,
        '任务名称': t.name,
        '类型': t.type === TASK_TYPE.MILESTONE ? '里程碑' : '任务',
        '父任务ID': t.parentId || '',
        '开始日期': formatDate(t.startDate),
        '结束日期': formatDate(t.endDate),
        '工期(天)': t.duration,
        '进度(%)': t.progress,
        '优先级': TASK_PRIORITY_LABEL[t.priority] || t.priority,
        '状态': TASK_STATUS_LABEL[t.status] || t.status,
        '负责人': t.assigneeId ? (resourceMap.get(t.assigneeId)?.name || t.assigneeId) : '',
        '前置任务': preds.join(', '),
        '分配资源': taskRes.join(', '),
        '描述': t.description || ''
      }
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(taskRows)
    XLSX.utils.book_append_sheet(wb, ws, '任务清单')

    if (resources.length > 0) {
      const resRows = resources.map((r) => ({
        'ID': r.id,
        '名称': r.name,
        '类型': RESOURCE_TYPE_LABEL[r.type] || r.type,
        '日可用工时(h)': r.dailyCapacity,
        '邮箱': r.email || ''
      }))
      const wsRes = XLSX.utils.json_to_sheet(resRows)
      XLSX.utils.book_append_sheet(wb, wsRes, '资源')
    }

    XLSX.writeFile(wb, `${project?.name || 'gantt'}-${dayjs().format('YYYYMMDD')}.xlsx`)
    toast.success('Excel 已导出')
  }

  const exportPdf = async () => {
    if (!ganttRef?.current) {
      toast.error('无法获取甘特图区域')
      return
    }
    const node = ganttRef.current
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const w = imgWidth * ratio
    const h = imgHeight * ratio
    const x = (pdfWidth - w) / 2
    const y = (pdfHeight - h) / 2
    pdf.addImage(imgData, 'PNG', x, y, w, h)
    pdf.save(`${project?.name || 'gantt'}-${dayjs().format('YYYYMMDD')}.pdf`)
    toast.success('PDF 已导出')
  }

  const exportMpx = () => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]))
    const resourceMap = new Map(resources.map((r) => [r.id, r]))

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<Project xmlns="http://schemas.microsoft.com/project">\n`
    xml += `  <Name>${escapeXml(project?.name || 'Gantt Project')}</Name>\n`
    xml += `  <StartDate>${dayjs().format('YYYY-MM-DD')}T00:00:00</StartDate>\n`
    xml += `  <FinishDate>${dayjs().add(30, 'day').format('YYYY-MM-DD')}T00:00:00</FinishDate>\n`
    xml += `  <CalendarUID>1</CalendarUID>\n`

    xml += `  <Calendars>\n`
    xml += `    <Calendar>\n`
    xml += `      <UID>1</UID>\n`
    xml += `      <Name>Standard</Name>\n`
    xml += `      <IsBaseCalendar>1</IsBaseCalendar>\n`
    xml += `      <BaseCalendarUID>-1</BaseCalendarUID>\n`
    xml += `      <WeekDays>\n`
    for (let i = 1; i <= 7; i++) {
      const isWorking = i >= 2 && i <= 6
      xml += `        <WeekDay>\n`
      xml += `          <DayType>${i}</DayType>\n`
      xml += `          <DayWorking>${isWorking ? 1 : 0}</DayWorking>\n`
      if (isWorking) {
        xml += `          <WorkingTimes>\n`
        xml += `            <WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime>\n`
        xml += `            <WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime>\n`
        xml += `          </WorkingTimes>\n`
      }
      xml += `        </WeekDay>\n`
    }
    xml += `      </WeekDays>\n`
    xml += `    </Calendar>\n`
    xml += `  </Calendars>\n`

    xml += `  <Tasks>\n`
    tasks.forEach((t, idx) => {
      xml += `    <Task>\n`
      xml += `      <UID>${idx + 1}</UID>\n`
      xml += `      <ID>${idx + 1}</ID>\n`
      xml += `      <Name>${escapeXml(t.name)}</Name>\n`
      xml += `      <Type>${t.type === TASK_TYPE.MILESTONE ? 1 : 0}</Type>\n`
      xml += `      <Start>${formatDate(t.startDate)}T08:00:00</Start>\n`
      xml += `      <Finish>${formatDate(t.endDate)}T17:00:00</Finish>\n`
      xml += `      <DurationWorking>${t.duration * 480}</DurationWorking>\n`
      xml += `      <Duration>${t.duration * 480}</Duration>\n`
      xml += `      <PercentComplete>${t.progress}</PercentComplete>\n`
      xml += `      <Priority>${priorityToMpx(t.priority)}</Priority>\n`
      if (t.parentId) {
        const pIdx = tasks.findIndex((x) => x.id === t.parentId)
        if (pIdx >= 0) xml += `      <OutlineParent>${pIdx + 1}</OutlineParent>\n`
      }
      xml += `    </Task>\n`
    })
    xml += `  </Tasks>\n`

    if (resources.length > 0) {
      xml += `  <Resources>\n`
      resources.forEach((r, idx) => {
        xml += `    <Resource>\n`
        xml += `      <UID>${idx + 1}</UID>\n`
        xml += `      <ID>${idx + 1}</ID>\n`
        xml += `      <Name>${escapeXml(r.name)}</Name>\n`
        xml += `      <MaxUnits>${r.dailyCapacity / 8 * 100}</MaxUnits>\n`
        xml += `    </Resource>\n`
      })
      xml += `  </Resources>\n`
    }

    if (links.length > 0) {
      xml += `  <Assignments>\n`
      links.forEach((l) => {
        const srcIdx = tasks.findIndex((t) => t.id === l.source)
        const tgtIdx = tasks.findIndex((t) => t.id === l.target)
        if (srcIdx < 0 || tgtIdx < 0) return
        xml += `    <Assignment>\n`
        xml += `      <TaskUID>${tgtIdx + 1}</TaskUID>\n`
        xml += `      <PredecessorUID>${srcIdx + 1}</PredecessorUID>\n`
        xml += `      <Type>${depTypeToMpx(l.type)}</Type>\n`
        xml += `    </Assignment>\n`
      })
      xml += `  </Assignments>\n`
    }

    xml += `</Project>\n`

    const blob = new Blob([xml], { type: 'application/xml' })
    downloadBlob(blob, `${project?.name || 'gantt'}-${dayjs().format('YYYYMMDD')}.xml`)
    toast.success('MS Project XML 已导出')
  }

  const escapeXml = (str) => {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const depTypeToMpx = (type) => {
    const map = { FS: 0, SS: 1, FF: 2, SF: 3 }
    return map[type] ?? 0
  }

  const priorityToMpx = (p) => {
    const map = { low: 200, medium: 500, high: 700, urgent: 1000 }
    return map[p] ?? 500
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      open={open}
      title="导出数据"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleExport}>导出</button>
        </>
      }
    >
      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>导出格式</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {[
            { k: 'pdf', label: 'PDF（甘特图）', desc: '当前视图截图导出' },
            { k: 'excel', label: 'Excel（任务清单）', desc: '全字段xlsx格式' },
            { k: 'mpx', label: 'MS Project XML', desc: '与MS Project互操作' },
            { k: 'json', label: 'JSON（完整数据）', desc: '用于数据迁移/备份' }
          ].map((opt) => (
            <label
              key={opt.k}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 10,
                border: exportType === opt.k ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: 6,
                cursor: 'pointer',
                minWidth: 140,
                background: exportType === opt.k ? '#eff6ff' : '#fff'
              }}
            >
              <span style={{ fontWeight: exportType === opt.k ? 600 : 400 }}>
                <input
                  type="radio"
                  name="exportType"
                  checked={exportType === opt.k}
                  onChange={() => setExportType(opt.k)}
                  style={{ marginRight: 6 }}
                />
                {opt.label}
              </span>
              <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{opt.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {exportType === 'pdf' && (
        <div className="form-field" style={{ marginBottom: 16 }}>
          <label>导出范围</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="radio"
                checked={rangeType === 'all'}
                onChange={() => setRangeType('all')}
              />
              整个项目
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="radio"
                checked={rangeType === 'custom'}
                onChange={() => setRangeType('custom')}
              />
              指定时间段
            </label>
          </div>
          {rangeType === 'custom' && (
            <div className="form-row" style={{ marginTop: 8 }}>
              <div className="form-field">
                <label>开始日期</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>结束日期</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 6, fontSize: 12, color: '#166534' }}>
        ✓ 所有数据均在本地浏览器处理，无网络请求
      </div>
    </Modal>
  )
}
