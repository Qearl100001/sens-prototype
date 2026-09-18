import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const out = '/private/tmp/sens-acceptance-oNDXtP';
const results = [], errors = [], failedRequests = [], warnings = [];
const browser = await chromium.launch({headless:true, channel:'chrome'});
const page = await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror', e=>errors.push(e.message));
page.on('console', m=>{if(['warning','error'].includes(m.type()))warnings.push({type:m.type(),text:m.text()});});
page.on('requestfailed', r=>failedRequests.push({url:r.url(),error:r.failure()}));
page.on('response', r=>{if(r.status()>=400)failedRequests.push({url:r.url(),status:r.status()});});
const button = label=>page.getByRole('button',{name:new RegExp(label.split('').join('\\s*')),exact:false});
const dialog = page.getByRole('dialog');
async function test(name, fn){try{await fn();results.push({name,status:'pass'});}catch(e){results.push({name,status:'fail',error:e.message});await page.screenshot({path:out+'/failure-'+results.length+'.png',fullPage:true});}}
try {
 await page.goto('http://127.0.0.1:5174/',{waitUntil:'networkidle'});
 await test('initial render',async()=>{await expect(page.getByText('示例记录',{exact:true})).toBeVisible();await expect(page.locator('tbody tr')).toHaveCount(1);});
 await page.screenshot({path:out+'/initial.png',fullPage:true});
 await test('create and required validation',async()=>{
  await button('创建').click();await expect(dialog).toBeVisible();
  await expect(page.getByRole('heading',{name:'创建记录'})).toBeVisible();
  await button('提交').click();
  await expect(page.getByRole('alert')).toHaveText('名称不能为空，请输入名称');
  await expect(page.getByLabel('名称',{exact:true})).toBeFocused();
  await expect(page.getByLabel('名称',{exact:true})).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.screenshot({path:out+'/validation.png',fullPage:true});
 });
 await test('save updates table and feedback',async()=>{
  await page.getByLabel('名称',{exact:true}).fill('验证记录');await expect(page.getByRole('alert')).toHaveCount(0);
  await button('提交').click();await expect(dialog).toHaveCount(0);
  await expect(page.getByText('创建成功',{exact:true})).toBeVisible();
  await expect(page.getByText('验证记录',{exact:true})).toBeVisible();await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.screenshot({path:out+'/saved.png',fullPage:true});
 });
 for(const action of ['取消','返回','Escape'])await test(action+' discards draft and restores focus',async()=>{
  await button('创建').click();await page.getByLabel('名称',{exact:true}).fill('不保存');
  if(action==='Escape')await page.keyboard.press('Escape');else await button(action).click();
  await expect(dialog).toHaveCount(0);await expect(page.locator('tbody tr')).toHaveCount(2);await expect(button('创建')).toBeFocused();
  await button('创建').click();await expect(page.getByLabel('名称',{exact:true})).toHaveValue('');await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 });
 await test('reset',async()=>{await button('重置').click();await expect(page.locator('tbody tr')).toHaveCount(1);});
 for(const width of [1280,1440,1920])await test('viewport '+width,async()=>{
  await page.setViewportSize({width,height:900});await button('创建').click();await expect(dialog).toBeVisible();
  await button('提交').click();await expect(page.getByRole('alert')).toBeVisible();
  const box=await dialog.boundingBox();if(!box||box.x<0||box.x+box.width>width+1)throw Error('Drawer out of viewport');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Horizontal page overflow');
  await page.screenshot({path:out+'/viewport-'+width+'.png',fullPage:true});
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 });
 await test('refresh resets in-memory data',async()=>{await page.reload({waitUntil:'networkidle'});await expect(page.locator('tbody tr')).toHaveCount(1);});
}catch(e){results.push({name:'runner',status:'fail',error:e.stack});}
await writeFile(out+'/report.json',JSON.stringify({url:page.url(),results,errors,failedRequests,warnings},null,2));
console.log(JSON.stringify({results,errors,failedRequests,warnings},null,2));
await browser.close();
