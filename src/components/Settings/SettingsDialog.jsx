import { useState } from 'react'
import Modal from '../common/Modal'
import { useSettingsStore } from '../../stores/settingsStore'
import { DEFAULT_SETTINGS } from '../../constants'

export default function SettingsDialog({ open, onClose }) {
  const excludeWeekends = useSettingsStore((s) => s.excludeWeekends)
  const baselineDeviationDays = useSettingsStore((s) => s.baselineDeviationDays)
  const criticalPathColor = useSettingsStore((s) => s.criticalPathColor)
  const workingHoursPerDay = useSettingsStore((s) => s.workingHoursPerDay)
  const setExcludeWeekends = useSettingsStore((s) => s.setExcludeWeekends)
  const setBaselineDeviationDays = useSettingsStore((s) => s.setBaselineDeviationDays)
  const setCriticalPathColor = useSettingsStore((s) => s.setCriticalPathColor)
  const setWorkingHoursPerDay = useSettingsStore((s) => s.setWorkingHoursPerDay)
  const resetSettings = useSettingsStore((s) => s.resetSettings)

  const handleReset = () => {
    if (confirm('确定恢复默认设置吗？')) {
      resetSettings()
    }
  }

  return (
    <Modal
      open={open}
      title="系统设置"
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={handleReset}>恢复默认</button>
          <button className="btn-primary" onClick={onClose}>确定</button>
        </>
      }
    >
      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>工作日设置</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <input
            type="checkbox"
            checked={excludeWeekends}
            onChange={(e) => setExcludeWeekends(e.target.checked)}
          />
          <span style={{ fontSize: 13 }}>计算工期时排除周末（周六、周日）</span>
        </label>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>每日标准工时（小时）</label>
          <input
            type="number"
            min="1"
            max="24"
            value={workingHoursPerDay}
            onChange={(e) => setWorkingHoursPerDay(parseFloat(e.target.value))}
          />
        </div>
        <div className="form-field">
          <label>基线偏差告警阈值（天）</label>
          <input
            type="number"
            min="0"
            max="30"
            value={baselineDeviationDays}
            onChange={(e) => setBaselineDeviationDays(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="form-field" style={{ marginTop: 16 }}>
        <label>关键路径颜色</label>
        <input
          type="color"
          value={criticalPathColor}
          onChange={(e) => setCriticalPathColor(e.target.value)}
          style={{ width: 80, height: 34, padding: 2 }}
        />
      </div>

      <div style={{ marginTop: 20, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>使用提示</div>
        <div>• 排除周末：计算工期、顺延依赖时自动跳过周六日</div>
        <div>• 基线偏差：实际进度与基线对比超过此天数的任务将高亮</div>
        <div>• 关键路径颜色：关键路径上的任务条边框颜色</div>
      </div>
    </Modal>
  )
}
