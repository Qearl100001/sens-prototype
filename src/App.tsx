import { useState } from 'react';
import {
  ProductShellSideNavigation,
  SensButton,
  SensPageTitleBar,
  SensProductShell,
  SensTopNavigation,
  type ProductShellSideNavigationMode,
} from '@sens/prototype-kit';

const navigationItems = [
  { label: '可视化' },
  { label: '分析', arrow: true },
  { label: '数据融合', arrow: true },
];

export function App() {
  const [sideNavigationMode, setSideNavigationMode] =
    useState<ProductShellSideNavigationMode>('docked');
  const [activeItem, setActiveItem] = useState('数据源管理');

  return (
    <SensProductShell
      layout="t"
      contentLabel={activeItem}
      sideNavigationMode={sideNavigationMode}
      topNavigation={
        <SensTopNavigation
          embedded
          atmosphere
          activeNavLabel="数据融合"
          items={navigationItems}
        />
      }
      sideNavigation={
        <ProductShellSideNavigation
          mode={sideNavigationMode}
          onModeChange={setSideNavigationMode}
          productName="数据融合"
          activeItem={activeItem}
          onActiveItemChange={setActiveItem}
          groups={[
            {
              key: 'access',
              label: '通用数据接入',
              defaultExpanded: true,
              items: ['数据源管理', '数据表管理', '字段映射', '接入任务'],
            },
            {
              key: 'quality',
              label: '数据质量',
              defaultExpanded: true,
              items: ['质量规则', '监控任务'],
            },
          ]}
        />
      }
      titleBar={
        <SensPageTitleBar
          variant="landing"
          title={activeItem}
          actions={<SensButton tone="primary">创建</SensButton>}
        />
      }
    >
      <main className="prototype-content" data-testid="prototype-content">
        {Array.from({ length: 16 }, (_, index) => (
          <section className="prototype-card" key={index}>
            <strong>独立产品壳内容 {index + 1}</strong>
            <p>用于验证滚动、顶导收起、标题栏投影与回到顶部。</p>
          </section>
        ))}
      </main>
    </SensProductShell>
  );
}
