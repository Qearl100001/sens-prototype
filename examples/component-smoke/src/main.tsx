import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SensPrototypeProvider, SensTitleBar, SensButton, SensForm, SensFormItem, SensInput, SensDrawer, TableShell, useSensMessage } from '@sens/prototype-kit';
import '@sens/prototype-kit/style.css';
import './reset.css';

type Row = { id: string; name: string };
const initialRows: Row[] = [{ id: 'demo-1', name: '示例记录' }];

function App() {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const message = useSensMessage();
  const validate = () => name.trim() ? '' : '名称不能为空，请输入名称';
  const close = () => { setOpen(false); setError(''); };
  const save = () => {
    const problem = validate();
    setError(problem);
    if (problem) {
      document.getElementById('record-name')?.focus();
      return;
    }
    setRows(current => [...current, { id: 'demo-' + (current.length + 1), name: name.trim() }]);
    close();
    message.success('创建成功');
  };
  return <main>
    <SensTitleBar title="独立组件验证" actions={<>
      <SensButton tone="secondary" onClick={() => { setRows(initialRows); setName(''); setError(''); setOpen(false); message.destroy(); }}>重置</SensButton>
      <SensButton tone="primary" onClick={() => { setName(''); setError(''); setOpen(true); }}>创建</SensButton>
    </>} />
    <TableShell<Row> rowKey="id" dataSource={rows} columns={[
      { title: '记录 ID', dataIndex: 'id', key: 'id' },
      { title: '名称', dataIndex: 'name', key: 'name' },
    ]} />
    <SensDrawer open={open} size="small" onClose={close} titleBar={
      <SensTitleBar title="创建记录" onBack={close} actions={<>
        <SensButton tone="secondary" onClick={close}>取消</SensButton>
        <SensButton tone="primary" onClick={save}>提交</SensButton>
      </>} />
    }>
      <SensForm layout="vertical">
        <SensFormItem label="名称" name="name" controlId="record-name" required error={error || undefined}>
          <SensInput id="record-name" name="name" aria-required="true" aria-invalid={!!error} aria-describedby={error ? 'record-name-meta' : undefined}
            status={error ? 'error' : undefined} value={name} placeholder="请输入名称" onChange={event => { setName(event.target.value); setError(''); }}
            onBlur={() => setError(validate())} onPressEnter={save} />
        </SensFormItem>
      </SensForm>
    </SensDrawer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><SensPrototypeProvider><App /></SensPrototypeProvider></React.StrictMode>);
