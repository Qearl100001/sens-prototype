import { useMemo, useState } from 'react';
import {
  SearchInput,
  SensButton,
  SensEmptyState,
  SensIcon,
  SensPopover,
  SensSelectDropdown,
  TableActions,
  TableEllipsis,
  TableShell,
} from '@sens/prototype-kit';
import type { StreamTask } from '../domain';
import { STATUS_LABEL } from '../domain';

interface StreamTaskListProps {
  tasks: StreamTask[];
  quota: number;
  canManage: boolean;
  showCreate: boolean;
  onCreate: () => void;
  onView: (task: StreamTask) => void;
  onEdit: (task: StreamTask) => void;
  onCopy: (task: StreamTask) => void;
  onToggleStatus: (task: StreamTask) => void;
  onDelete: (task: StreamTask) => void;
  onDownloadLog: (task: StreamTask) => void;
}

export function StreamTaskList({
  tasks,
  quota,
  canManage,
  showCreate,
  onCreate,
  onView,
  onEdit,
  onCopy,
  onToggleStatus,
  onDelete,
  onDownloadLog,
}: StreamTaskListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<StreamTask | null>(null);
  const runningCount = tasks.filter((task) => task.status === 'running' || task.status === 'abnormal').length;
  const quotaFull = runningCount >= quota;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || String(task.id).includes(query) || task.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, tasks]);

  const closeDeleteConfirm = (task: StreamTask) => {
    setDeleteTarget(null);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(
        `.task-actions[data-task-id="${task.id}"] .sens-dropdown-btn`,
      )?.focus();
    });
  };

  const columns = [
    { title: '任务 ID', dataIndex: 'id', key: 'id', width: 92 },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (_: unknown, task: StreamTask) => (
        <SensButton tone="linkWeak" onClick={() => onView(task)}>{task.name}</SensButton>
      ),
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (_: unknown, task: StreamTask) => (
        <div className={'task-status task-status--' + task.status}>
          <span className="task-status__dot" aria-hidden />
          <span>{STATUS_LABEL[task.status]}</span>
          {task.status === 'abnormal' ? (
            <SensButton aria-label={'导出 ' + task.name + ' 日志'} tone="link" onClick={() => onDownloadLog(task)}>
              <SensIcon name="download" />
            </SensButton>
          ) : null}
        </div>
      ),
    },
    { title: '执行频率', key: 'frequency', width: 100, render: () => '长期执行' },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 120 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: '最后编辑时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 180,
      render: (value: string) => <TableEllipsis>{value}</TableEllipsis>,
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 330,
      render: (_: unknown, task: StreamTask) => {
        const running = task.status === 'running' || task.status === 'abnormal';
        const runDisabled = !canManage || (!running && quotaFull);
        return (
          <div className="task-actions" data-task-id={task.id}>
            <TableActions items={[
                { key: 'view', label: '查看任务', onClick: () => onView(task) },
                {
                  key: 'toggle',
                  label: running ? '暂停' : '运行',
                  disabled: runDisabled,
                  onClick: () => onToggleStatus(task),
                },
                {
                  key: 'edit',
                  label: '编辑',
                  disabled: !canManage || running,
                  onClick: () => onEdit(task),
                },
                {
                  key: 'copy',
                  label: '复制',
                  disabled: !canManage,
                  onClick: () => onCopy(task),
                },
                {
                  key: 'delete',
                  label: '删除',
                  disabled: !canManage || running,
                  onClick: () => setDeleteTarget(task),
                },
              ]} />
            <span className="delete-confirm-positioner">
              <SensPopover
                open={deleteTarget?.id === task.id}
                onOpenChange={(open) => {
                  if (open) setDeleteTarget(task);
                  else closeDeleteConfirm(task);
                }}
                variant="confirm"
                size="small"
                placement="left"
                align="center"
                title="确认要删除该任务吗？"
                content="删除后任务记录不可恢复。"
                actions={(
                  <>
                    <SensButton size="small" tone="dangerSecondary" onClick={() => { onDelete(task); setDeleteTarget(null); }}>确定</SensButton>
                    <SensButton size="small" tone="secondary" onClick={() => closeDeleteConfirm(task)}>取消</SensButton>
                  </>
                )}
              >
                <span className="delete-confirm-anchor" aria-hidden />
              </SensPopover>
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <main className="list-page" data-testid="stream-task-list">
      <div className="page-heading">
        <div>
          <h1>数据同步</h1>
          <div className="task-tabs" role="tablist" aria-label="同步任务类型">
            <button type="button" role="tab" aria-selected="false">批任务</button>
            <button type="button" role="tab" aria-selected="true">流任务</button>
          </div>
        </div>
        <div className="page-heading__actions">
          <SensButton tone="secondary" disabled title="当前原型暂不支持 Schema 配置">Schema 配置</SensButton>
          {showCreate ? (
            <SensButton tone="primary" disabled={!canManage} onClick={onCreate}>创建任务</SensButton>
          ) : null}
        </div>
      </div>

      <div className="list-toolbar">
        <SearchInput
          value={search}
          placeholder="请输入任务 ID 或任务名称"
          onChange={(event) => setSearch(event.target.value)}
        />
        <SensSelectDropdown
          mode="multiple"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as string[])}
          placeholder="任务状态"
          multiDisplay="count"
          options={[
            { value: 'waiting', label: '等待运行' },
            { value: 'running', label: '运行中' },
            { value: 'abnormal', label: '运行中 · 异常' },
            { value: 'paused', label: '已暂停' },
          ]}
          style={{ width: 180 }}
        />
        {!canManage ? <span className="scenario-note">当前为仅查看权限，管理操作不可用</span> : null}
      </div>

      {tasks.length === 0 ? (
        <div className="list-empty">
          <SensEmptyState
            scope="non-page"
            size="base"
            type="noData"
            title="暂无数据"
            description={showCreate ? '您可以先点击“创建任务”，进行创建' : '当前暂无可查看的流任务'}
            actions={showCreate ? <SensButton tone="primary" disabled={!canManage} onClick={onCreate}>创建任务</SensButton> : undefined}
          />
        </div>
      ) : (
        <TableShell
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={false}
          scroll={{ x: 1460 }}
          showInfoBar
          infoContent={(
            <span>
              共 {filtered.length} 条，流任务可用配额
              <strong className={quotaFull ? 'quota quota--full' : 'quota'}> {runningCount} / {quota} </strong>
              条
            </span>
          )}
          footerBar={<div className="table-footer">本页显示第 1–{filtered.length} 条</div>}
        />
      )}
    </main>
  );
}
