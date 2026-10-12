import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  SensAlert,
  SensButton,
  SensCheckboxGroup,
  SensDrawer,
  SensForm,
  SensFormItem,
  SensIcon,
  SensInput,
  SensPopover,
  SensRadioGroup,
  SensSelectDropdown,
  SensTextArea,
  SensTitleBar,
} from '@sens/prototype-kit';
import {
  TODAY_ISO,
  formatDate,
  isHistorical,
  type CalendarOverride,
  type CalendarStatus,
  type DateRangeRule,
} from '../domain';

interface SingleEditDrawerProps {
  open: boolean;
  value: CalendarOverride | null;
  onClose: () => void;
  onSave: (value: CalendarOverride) => void;
}

export function SingleEditDrawer({ open, value, onClose, onSave }: SingleEditDrawerProps) {
  const [status, setStatus] = useState<CalendarStatus>('trading');
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => {
    if (!value) return;
    setStatus(value.status);
    setNote(value.note);
    setConfirmOpen(false);
  }, [value]);
  if (!value) return null;
  const invalid = note.length > 200;
  const save = () => {
    if (!invalid) onSave({ ...value, status, note });
  };
  const requiresConfirm = isHistorical(value.date) && status !== value.status;
  const actions = (
    <>
      <SensButton tone="secondary" onClick={onClose}>取消</SensButton>
      <SensPopover
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="confirm"
        size="small"
        placement="bottom"
        align="end"
        title="确认修改交易日状态？"
        content="修改后将影响基于交易日历的日期计算相关任务，确认是否继续？"
        actions={(
          <>
            <SensButton size="small" tone="dangerSecondary" onClick={() => { save(); setConfirmOpen(false); }}>确认修改</SensButton>
            <SensButton size="small" tone="secondary" onClick={() => setConfirmOpen(false)}>取消</SensButton>
          </>
        )}
      >
        <SensButton tone="primary" disabled={invalid} onClick={() => requiresConfirm ? setConfirmOpen(true) : save()}>保存</SensButton>
      </SensPopover>
    </>
  );
  return (
    <SensDrawer open={open} size="small" onClose={onClose} titleBar={<SensTitleBar title="编辑日期" actions={actions} onBack={onClose} />}>
      <div className="drawer-content drawer-content--single" data-testid="single-edit-drawer">
        <SensForm layout="vertical">
          <SensFormItem label="日期">
            <SensInput value={formatDate(value.date)} readOnlyVariant="filled" />
          </SensFormItem>
          <SensFormItem label="日期类型" required>
            <SensRadioGroup
              direction="horizontal"
              name="single-status"
              value={status}
              onChange={(next) => setStatus(next as CalendarStatus)}
              options={[{ value: 'trading', label: '交易日' }, { value: 'closed', label: '非交易日' }]}
            />
          </SensFormItem>
          <SensFormItem
            label="备注"
            optional="（选填）"
            error={invalid ? '备注不能超过 200 个字符' : undefined}
            counter={`${note.length}/200`}
          >
            <SensTextArea value={note} maxLength={220} placeholder="请输入备注" onChange={(event) => setNote(event.target.value)} />
          </SensFormItem>
        </SensForm>
      </div>
    </SensDrawer>
  );
}

interface BatchEditDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (ranges: DateRangeRule[], status: CalendarStatus, note: string) => void;
}

export function BatchEditDrawer({ open, onClose, onSave }: BatchEditDrawerProps) {
  const [ranges, setRanges] = useState<DateRangeRule[]>([{ id: 1, start: '', end: '' }]);
  const [status, setStatus] = useState<CalendarStatus>('trading');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    setRanges([{ id: 1, start: '', end: '' }]);
    setStatus('trading');
    setNote('');
    setSubmitted(false);
    setConfirmOpen(false);
  }, [open]);
  const valid = ranges.length > 0 && ranges.every((range) => range.start && range.end && range.start <= range.end) && note.length <= 200;
  const hasHistory = ranges.some((range) => range.start && range.start < TODAY_ISO);
  const updateRange = (id: number, field: 'start' | 'end', value: string) => {
    setRanges((current) => current.map((range) => range.id === id ? { ...range, [field]: value } : range));
  };
  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    if (hasHistory) setConfirmOpen(true);
    else onSave(ranges, status, note);
  };
  const actions = (
    <>
      <SensButton tone="secondary" onClick={onClose}>取消</SensButton>
      <SensPopover
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="confirm"
        size="small"
        placement="bottom"
        align="end"
        title="确认修改交易日状态？"
        content="本次包含历史日期，修改后会影响未执行或待重算任务。"
        actions={(
          <>
            <SensButton size="small" tone="dangerSecondary" onClick={() => { onSave(ranges, status, note); setConfirmOpen(false); }}>确认修改</SensButton>
            <SensButton size="small" tone="secondary" onClick={() => setConfirmOpen(false)}>取消</SensButton>
          </>
        )}
      >
        <SensButton tone="primary" onClick={submit}>提交</SensButton>
      </SensPopover>
    </>
  );
  return (
    <SensDrawer open={open} size="medium" onClose={onClose} titleBar={<SensTitleBar title="编辑交易日" actions={actions} onBack={onClose} />}>
      <div className="drawer-content drawer-content--batch" data-testid="batch-edit-drawer">
        <SensForm layout="vertical">
          <SensFormItem label="日期配置" required error={submitted && !valid ? '请补充完整且有效的日期范围' : undefined}>
            <div className="range-list">
              {ranges.map((range, index) => (
                <div className="range-row" key={range.id}>
                  <span>范围 {index + 1}</span>
                  <SensInput type="date" aria-label={`范围 ${index + 1} 开始日期`} value={range.start} onChange={(event) => updateRange(range.id, 'start', event.target.value)} />
                  <span>至</span>
                  <SensInput type="date" aria-label={`范围 ${index + 1} 结束日期`} value={range.end} onChange={(event) => updateRange(range.id, 'end', event.target.value)} />
                  <SensButton tone="tertiary" aria-label={`删除范围 ${index + 1}`} disabled={ranges.length === 1} icon={<SensIcon name="delete" />} onClick={() => setRanges((current) => current.filter((item) => item.id !== range.id))} />
                </div>
              ))}
            </div>
            <SensButton
              tone="link"
              icon={<SensIcon name="add" />}
              onClick={() => setRanges((current) => [...current, { id: Math.max(...current.map((item) => item.id)) + 1, start: '', end: '' }])}
            >
              添加日期范围
            </SensButton>
          </SensFormItem>
          <SensFormItem label="日期类型" required>
            <SensRadioGroup
              direction="horizontal"
              name="batch-status"
              value={status}
              onChange={(next) => setStatus(next as CalendarStatus)}
              options={[{ value: 'trading', label: '交易日' }, { value: 'closed', label: '非交易日' }]}
            />
          </SensFormItem>
          <SensFormItem label="备注" optional="（选填）" error={note.length > 200 ? '备注不能超过 200 个字符' : undefined} counter={`${note.length}/200`}>
            <SensTextArea value={note} maxLength={220} placeholder="请输入备注" onChange={(event) => setNote(event.target.value)} />
          </SensFormItem>
        </SensForm>
      </div>
    </SensDrawer>
  );
}

type UploadState = 'idle' | 'format-error' | 'content-error' | 'incomplete' | 'valid';

interface UploadDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadDrawer({ open, onClose, onSuccess }: UploadDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [state, setState] = useState<UploadState>('idle');
  useEffect(() => {
    if (!open) return;
    setFileName('');
    setState('idle');
  }, [open]);
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const name = file.name;
    setFileName(name);
    if (!/\.xlsx?$/i.test(name) || name.includes('format')) setState('format-error');
    else if (name.includes('content')) setState('content-error');
    else if (name.includes('incomplete')) setState('incomplete');
    else setState('valid');
  };
  const messages: Record<UploadState, { tone: string; text: string; icon: 'info' | 'error' | 'complete' }> = {
    idle: { tone: 'neutral', icon: 'info', text: '请选择完整自然年的交易日历文件' },
    'format-error': { tone: 'error', icon: 'error', text: '文件格式错误，请上传 .xlsx 或 .xls 格式的 Excel 文件' },
    'content-error': { tone: 'error', icon: 'error', text: '文件内容填写有误，请下载错误详情并重新上传' },
    incomplete: { tone: 'error', icon: 'error', text: '导入失败，请上传完整自然年交易日历文件' },
    valid: { tone: 'success', icon: 'complete', text: '校验通过，已上传日期范围：2026-01-01 至 2026-12-31' },
  };
  const actions = (
    <>
      <SensButton tone="secondary" onClick={onClose}>取消</SensButton>
      <SensButton tone="primary" disabled={state !== 'valid'} onClick={onSuccess}>提交</SensButton>
    </>
  );
  return (
    <SensDrawer open={open} size="small" onClose={onClose} titleBar={<SensTitleBar title="批量上传" actions={actions} onBack={onClose} />}>
      <div className="drawer-content drawer-content--upload" data-testid="upload-drawer">
        <SensAlert
          className="upload-alert"
          type="info"
          description="请使用系统模板补全全年日期和状态后再导入。"
        >
          当前仅支持完整自然年交易日历导入，不支持部分日期上传。
        </SensAlert>
        <section className="upload-guide">
          <h2 className="drawer-section-title">上传交易日历</h2>
          <p>请下载交易日模板并填写内容，上传并通过校验后，可完成批量创建。</p>
          <SensButton tone="link" icon={<SensIcon name="download" />}>下载模板</SensButton>
        </section>
        <section className="upload-box">
          <SensIcon name="upload" sizeToken="size/icon/l" colorRole="subtle" />
          <strong>{fileName || '选择 Excel 文件'}</strong>
          <span>支持 .xlsx / .xls 格式</span>
          <input ref={inputRef} className="visually-hidden" type="file" accept=".xlsx,.xls" onChange={chooseFile} />
          <SensButton tone="secondary" onClick={() => inputRef.current?.click()}>选择文件</SensButton>
        </section>
        <div className={`upload-result upload-result--${messages[state].tone}`} aria-live="polite">
          <span className="upload-result__message">
            <SensIcon name={messages[state].icon} variant="filled" sizeToken="size/icon/m" colorRole="inherit" />
            <span>{messages[state].text}</span>
          </span>
          {state === 'content-error' ? <SensButton tone="link">下载错误详情</SensButton> : null}
        </div>
      </div>
    </SensDrawer>
  );
}

interface NotificationDrawerProps {
  open: boolean;
  initialized: boolean;
  firstVisit: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSave: () => void;
}

export function NotificationDrawer({ open, initialized, firstVisit, onClose, onSkip, onSave }: NotificationDrawerProps) {
  const [editing, setEditing] = useState(firstVisit || !initialized);
  const [channels, setChannels] = useState<string[]>(initialized ? ['in-app'] : []);
  const [emailSender, setEmailSender] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [webhook, setWebhook] = useState('');
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (!open) return;
    setEditing(firstVisit || !initialized);
    setSubmitted(false);
  }, [firstVisit, initialized, open]);
  const validEmail = !channels.includes('email') || (emailSender && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRecipients));
  const validWebhook = !channels.includes('webhook') || Boolean(webhook);
  const valid = channels.length > 0 && validEmail && validWebhook;
  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    onSave();
    setEditing(false);
  };
  const summary = useMemo(() => channels.map((channel) => ({ 'in-app': '站内通知', email: '邮件通知', webhook: 'Webhook 通知' }[channel])).join('、'), [channels]);
  const closeDrawer = firstVisit && !initialized ? onSkip : onClose;
  const actions = editing ? (
    <>
      {firstVisit && !initialized ? <SensButton tone="secondary" onClick={onSkip}>暂不配置</SensButton> : <SensButton tone="secondary" onClick={() => initialized ? setEditing(false) : onClose()}>放弃</SensButton>}
      <SensButton tone="primary" onClick={save}>保存配置</SensButton>
    </>
  ) : <SensButton tone="primary" onClick={() => setEditing(true)}>编辑</SensButton>;
  return (
    <SensDrawer open={open} size="medium" onClose={closeDrawer} titleBar={<SensTitleBar title="通知配置" actions={actions} onBack={closeDrawer} />}>
      <div className="drawer-content drawer-content--notification notification-drawer" data-testid="notification-drawer">
        <SensAlert className="notification-alert" type="default">
          当次年交易日历未上传或日期状态缺失时发送通知，避免影响分析模型、标签分群等依赖交易日功能的正常调度。
        </SensAlert>
        {!editing ? (
          <section className="notification-summary">
            <section className="notification-summary__section">
              <h2 className="drawer-section-title">交易日历上传提醒</h2>
              <dl>
                <div><dt>通知方式</dt><dd>{summary || '未配置'}</dd></div>
                <div><dt>指定对象</dt><dd>管理员角色</dd></div>
              </dl>
            </section>
            <section className="notification-summary__section">
              <h2 className="drawer-section-title">交易日历状态变更提醒</h2>
              <p>与上传提醒使用相同的通知方式。</p>
            </section>
          </section>
        ) : (
          <SensForm layout="vertical" className="notification-form">
            <section className="notification-section">
              <h2 className="drawer-section-title">交易日历上传提醒</h2>
              <SensFormItem label="通知方式" required error={submitted && channels.length === 0 ? '请至少配置一种通知方式' : undefined}>
                <SensCheckboxGroup
                  direction="horizontal"
                  name="notification-channels"
                  value={channels}
                  onChange={setChannels}
                  options={[
                    { value: 'in-app', label: '站内通知' },
                    { value: 'email', label: '邮件通知' },
                    { value: 'webhook', label: 'Webhook 通知' },
                  ]}
                />
              </SensFormItem>
              {channels.includes('in-app') ? (
                <SensFormItem label="指定对象">
                  <SensInput value="管理员角色" readOnlyVariant="filled" />
                </SensFormItem>
              ) : null}
              {channels.includes('email') ? (
                <div className="channel-fields">
                  <SensFormItem label="发件地址" required error={submitted && !emailSender ? '请选择发件地址' : undefined}>
                    <SensSelectDropdown
                      value={emailSender || undefined}
                      placeholder="请选择发件地址"
                      options={[{ value: 'notice@sensorsdata.cn', label: 'notice@sensorsdata.cn' }]}
                      onChange={(next) => setEmailSender(String(next))}
                    />
                  </SensFormItem>
                  <SensFormItem label="收件地址" required error={submitted && !validEmail ? '请输入有效邮箱地址' : undefined}>
                    <SensInput value={emailRecipients} placeholder="请输入收件地址" onChange={(event) => setEmailRecipients(event.target.value)} />
                  </SensFormItem>
                </div>
              ) : null}
              {channels.includes('webhook') ? (
                <SensFormItem label="企业群" required error={submitted && !webhook ? '请选择需要发送的企业群' : undefined}>
                  <SensSelectDropdown
                    value={webhook || undefined}
                    placeholder="请选择需要发送的企业群"
                    options={[{ value: 'finance-ops', label: '金融运营通知群' }, { value: 'data-admin', label: '数据管理员群' }]}
                    onChange={(next) => setWebhook(String(next))}
                  />
                </SensFormItem>
              ) : null}
            </section>
            <section className="notification-section notification-section--optional">
              <h2 className="drawer-section-title">交易日历状态变更提醒</h2>
              <p>本原型复用上传提醒的通知方式；正式产品可单独配置。</p>
            </section>
          </SensForm>
        )}
      </div>
    </SensDrawer>
  );
}
