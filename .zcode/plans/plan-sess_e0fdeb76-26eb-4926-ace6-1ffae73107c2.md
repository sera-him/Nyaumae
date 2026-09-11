在角色总览（src/data/characters.ts）中新增角色 Retina，身份为 Pupil（小学生）。

## 具体改动

**1. `src/data/characters.ts` — 在 `charactersInSourceOrder` 数组末尾（墨问之后）追加：**

```ts
{
  id: 'retina', name: 'Retina', alias: 'retina', birthYear: 2019, age: 7,
  group: 'other', groupLabel: '其他', title: 'Pupil · 小学生',
  bio: '字面意义上的"pupil"——一名小学生。背书包、写作业、上课举手发言，是人群里最常见的那种小学生。',
  profile: [
    { label: '身份', value: '小学生（Pupil）' },
    { label: '阵营', value: '其他' },
  ],
  color: 'from-sky-400 to-indigo-500',
},
```

- 年龄定为 7 岁（birthYear 2019，约小学一二年级），总览页按年龄排序时自动排在 7 岁组（棋程之后）
- 归入「其他」阵营，与其他原创角色一致
- 不设 fsiq/fsiii（可选项，小满、小谷等也没有）

**2. `src/pages/CharactersPage.tsx:146` — 修正无图角色的兜底显示：**

现在卡片对无图角色硬编码显示米迷的图（`|| '/characters/miia-generated.png'`）。改为：无映射图时显示中性占位（角色色渐变背景 + 名字首字母）。目前所有角色都有图，所以此改动只影响 Retina；详情页无图时本来就显示图标占位，无需改动。

## 验证

- `npm run build`（含 tsc 类型检查）确认编译通过
- 新路由 `/characters/retina` 由现有通用路由自动生效，无需额外注册

## 备注

以后想给 Retina 配图：把图片放进 `public/characters/retina.jpg`，在 `src/data/characterImages.ts` 的映射表加一行 `retina: 'characters/retina.jpg'` 即可。名字、简介、年龄等文案如需调整，告诉我具体内容即可替换。