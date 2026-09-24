export type PageMode = 'list' | 'create' | 'detail' | 'edit' | 'copy';
export type TaskStatus = 'waiting' | 'running' | 'abnormal' | 'paused';
export type ConsumeStart = 'earliest' | 'latest' | 'timestamp' | 'offset';
export type PartitionMode = 'hash' | 'parallel';

export interface StreamTask {
  id: number;
  name: string;
  status: TaskStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  sourceConnection: string;
  sourceData: string;
  schema: string;
  standardJson: boolean;
  targetData: string;
  userKeySource: string;
  userKeyTarget: string;
  mappings: Array<{ id: string; source: string; target: string }>;
  consumeStart: ConsumeStart;
  partitionMode: PartitionMode;
  hashFields: string[];
  skipInvalid: boolean;
  parallelism: number | null;
  optimization: string;
  alarmEnabled: boolean;
  alarmWindow: number;
  alarmRetries: number;
}

export interface TaskDraft {
  name: string;
  description: string;
  sourceConnection: string;
  sourceData: string;
  schema: string;
  standardJson: boolean;
  targetData: string;
  userKeySource: string;
  userKeyTarget: string;
  mappings: Array<{ id: string; source: string; target: string }>;
  consumeStart: ConsumeStart;
  timestamp: number | null;
  offset: number | null;
  runImmediately: boolean;
  partitionMode: PartitionMode;
  hashFields: string[];
  skipInvalid: boolean;
  parallelism: number | null;
  optimization: string;
  allowStrongValidationCreate: boolean;
  alarmEnabled: boolean;
  alarmRestartEnabled: boolean;
  alarmWindow: number | null;
  alarmRetries: number | null;
  alarmInvalidEnabled: boolean;
  alarmInvalidWindow: number | null;
  alarmInvalidCount: number | null;
}

export const SOURCE_CONNECTIONS = [
  { value: 'kafka-prod', label: 'Kafka / 一个 Kafka 数据源连接名称' },
  { value: 'kafka-backup', label: 'Kafka / 备用消息队列连接' },
  { value: 'hdfs-error', label: 'HDFS / 一个异常的连接名称' },
];

export const SOURCE_DATA: Record<string, Array<{ value: string; label: string; standardJson?: boolean }>> = {
  'kafka-prod': [
    { value: 'pair_coupon', label: 'pair_coupon/we_user' },
    { value: 'sa_standard', label: 'sensors_standard_json', standardJson: true },
  ],
  'kafka-backup': [
    { value: 'order_event', label: 'orders/realtime_event' },
  ],
};

export const SCHEMA_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  pair_coupon: [{ value: 'pair-schema', label: 'pair_coupon/we_user' }],
  sa_standard: [{ value: 'standard-schema', label: '神策标准 JSON 格式' }],
  order_event: [{ value: 'order-schema', label: 'orders/realtime_event' }],
};

export const TARGET_FIELDS = [
  { value: 'user_id', label: '用户 ID' },
  { value: 'distinct_id', label: 'distinct_id' },
  { value: 'item_id', label: 'Item id' },
  { value: 'event_name', label: '事件名' },
  { value: 'event_time', label: '事件时间' },
];

export const TARGET_DATA_OPTIONS = [
  { value: 'user-tags', label: '用户实体（user）/ 标签' },
  { value: 'event-order', label: '事件表 / OrderCreated' },
  { value: 'detail-order', label: '明细表 / order_detail' },
  { value: 'auto-events', label: '用户实体/事件表/Events' },
];

export const SOURCE_FIELDS = [
  { value: 'user_id', label: 'user id' },
  { value: 'distinct_id', label: 'distinct id' },
  { value: 'item_id', label: 'Item id' },
  { value: 'crowd', label: '人群' },
  { value: 'crowd_1', label: '人群 1' },
  { value: 'crowd_2', label: '人群 2' },
  { value: 'event', label: 'event' },
];

export const EMPTY_DRAFT: TaskDraft = {
  name: '',
  description: '',
  sourceConnection: '',
  sourceData: '',
  schema: '',
  standardJson: false,
  targetData: '',
  userKeySource: '',
  userKeyTarget: '',
  mappings: [{ id: 'mapping-1', source: '', target: '' }],
  consumeStart: 'earliest',
  timestamp: null,
  offset: null,
  runImmediately: false,
  partitionMode: 'hash',
  hashFields: ['distinct_id', 'item_id'],
  skipInvalid: false,
  parallelism: null,
  optimization: '',
  allowStrongValidationCreate: false,
  alarmEnabled: true,
  alarmRestartEnabled: false,
  alarmWindow: null,
  alarmRetries: null,
  alarmInvalidEnabled: false,
  alarmInvalidWindow: null,
  alarmInvalidCount: null,
};

export const INITIAL_TASKS: StreamTask[] = [
  {
    id: 238,
    name: '订单实时同步',
    status: 'waiting',
    creator: '平台管理员',
    createdAt: '2026-09-20 14:06',
    updatedAt: '2026-09-20 14:06',
    description: '将订单消息实时同步到事件表',
    sourceConnection: 'Kafka / 一个 Kafka 数据源连接名称',
    sourceData: 'pair_coupon/we_user',
    schema: 'pair_coupon/we_user',
    standardJson: false,
    targetData: '用户实体（user）/ 标签',
    userKeySource: 'user_id',
    userKeyTarget: 'user_id',
    mappings: [{ id: 'mapping-1', source: 'event', target: 'event_name' }],
    consumeStart: 'earliest',
    partitionMode: 'hash',
    hashFields: ['distinct_id', 'item_id'],
    skipInvalid: false,
    parallelism: 100,
    optimization: '',
    alarmEnabled: true,
    alarmWindow: 12,
    alarmRetries: 10,
  },
  {
    id: 237,
    name: '会员行为实时流',
    status: 'running',
    creator: '李郁文',
    createdAt: '2026-09-19 16:20',
    updatedAt: '2026-09-20 10:40',
    description: '实时写入会员行为事件',
    sourceConnection: 'Kafka / 一个 Kafka 数据源连接名称',
    sourceData: 'sensors_standard_json',
    schema: '神策标准 JSON 格式',
    standardJson: true,
    targetData: '事件表（自动识别）',
    userKeySource: '',
    userKeyTarget: '',
    mappings: [],
    consumeStart: 'latest',
    partitionMode: 'parallel',
    hashFields: [],
    skipInvalid: true,
    parallelism: 100,
    optimization: '',
    alarmEnabled: true,
    alarmWindow: 10,
    alarmRetries: 5,
  },
  {
    id: 236,
    name: '门店订单异常流',
    status: 'abnormal',
    creator: '平台管理员',
    createdAt: '2026-09-18 09:12',
    updatedAt: '2026-09-20 13:58',
    description: '异常状态用于检查日志导出入口',
    sourceConnection: 'Kafka / 备用消息队列连接',
    sourceData: 'orders/realtime_event',
    schema: 'orders/realtime_event',
    standardJson: false,
    targetData: '事件表 / OrderCreated',
    userKeySource: 'user_id',
    userKeyTarget: 'user_id',
    mappings: [{ id: 'mapping-1', source: 'event', target: 'event_name' }],
    consumeStart: 'offset',
    partitionMode: 'hash',
    hashFields: ['event_name', 'event_time'],
    skipInvalid: false,
    parallelism: 100,
    optimization: '',
    alarmEnabled: true,
    alarmWindow: 5,
    alarmRetries: 3,
  },
  {
    id: 235,
    name: '已暂停的测试任务',
    status: 'paused',
    creator: '系统管理员',
    createdAt: '2026-09-17 11:08',
    updatedAt: '2026-09-20 09:30',
    description: '用于验证暂停后编辑和删除',
    sourceConnection: 'Kafka / 一个 Kafka 数据源连接名称',
    sourceData: 'pair_coupon/we_user',
    schema: 'pair_coupon/we_user',
    standardJson: false,
    targetData: '用户实体（user）/ 标签',
    userKeySource: 'user_id',
    userKeyTarget: 'user_id',
    mappings: [{ id: 'mapping-1', source: 'event', target: 'event_name' }],
    consumeStart: 'earliest',
    partitionMode: 'hash',
    hashFields: ['distinct_id', 'item_id'],
    skipInvalid: true,
    parallelism: 100,
    optimization: '',
    alarmEnabled: true,
    alarmWindow: 12,
    alarmRetries: 10,
  },
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  waiting: '等待运行',
  running: '运行中',
  abnormal: '运行中 · 异常',
  paused: '已暂停',
};

export function draftFromTask(task: StreamTask): TaskDraft {
  const targetData = TARGET_DATA_OPTIONS.find((option) => option.label === task.targetData)?.value
    ?? (task.standardJson ? 'auto-events' : '');
  return {
    ...EMPTY_DRAFT,
    name: task.name,
    description: task.description,
    sourceConnection: task.sourceConnection.includes('备用') ? 'kafka-backup' : 'kafka-prod',
    sourceData: task.standardJson ? 'sa_standard' : task.sourceData.includes('orders') ? 'order_event' : 'pair_coupon',
    schema: task.standardJson ? 'standard-schema' : task.sourceData.includes('orders') ? 'order-schema' : 'pair-schema',
    standardJson: task.standardJson,
    targetData,
    userKeySource: task.userKeySource,
    userKeyTarget: task.userKeyTarget,
    mappings: task.mappings.map((mapping) => ({ ...mapping })),
    consumeStart: task.consumeStart,
    partitionMode: task.partitionMode,
    hashFields: [...task.hashFields],
    skipInvalid: task.skipInvalid,
    parallelism: task.parallelism,
    optimization: task.optimization,
    alarmEnabled: task.alarmEnabled,
    alarmRestartEnabled: true,
    alarmWindow: task.alarmWindow,
    alarmRetries: task.alarmRetries,
  };
}
