/*
 * 本地路径 → 远程图床 URL 映射
 *
 * 工作原理：
 * 1. SmartImage/RotatingImage 优先尝试 remoteUrl（图床 CDN）
 * 2. 如果 remoteUrl 加载失败（404/超时），自动 fallback 到本地 p(localPath)
 * 3. fallback 结果会缓存，后续渲染不再重试失败的 URL
 * 4. 修改此文件即可无缝切换图床，无需改动组件代码
 *
 * 当前使用 uguu.se（免费图床，文件长期保留）。
 * 如需切换：运行 node upload-images.mjs <lsky|aliyun|tencent|hellohao> --options
 */

export const imageHostMap: Record<string, string> = {
  "/story-miia-dream.jpg": "https://n.uguu.se/GHcMQzFj.jpg",
  "/story-agi-pyramid.jpg": "https://h.uguu.se/yUgVRmjW.jpg",
  "/story-lila.jpg": "https://d.uguu.se/zRNVMkAO.jpg",
  "/story-paradigm.jpg": "https://d.uguu.se/tQelpQFD.jpg",
  "/story-code-poem.jpg": "https://h.uguu.se/Cmnpaqtl.jpg",
  "/story-bad-rabbit.jpg": "https://n.uguu.se/QECWsBPz.jpg",
  "/story-sheep-song.jpg": "https://h.uguu.se/kDBcZSxf.jpg",
  "/story-overdose-icu.jpg": "https://h.uguu.se/hnNDeByJ.jpg",
  "/story-xishou-nianshou.jpg": "https://n.uguu.se/rPubgrBq.jpg",
  "/story-3-people-world.jpg": "https://n.uguu.se/rZiPOjwm.jpg",
  "/story-prime-focus.jpg": "https://d.uguu.se/TbsxrzXq.jpg",
  "/story-fill-ocean.jpg": "https://d.uguu.se/geAzfSaW.jpg",
  "/story-damocles-exam.jpg": "https://n.uguu.se/xpYjUwXA.jpg",
  "/story-mia-world-1.jpg": "https://h.uguu.se/bPEbvDwb.jpg",
  "/story-fox-penguin.jpg": "https://n.uguu.se/nLSSXxMX.jpg",
  "/story-agi-land.jpg": "https://d.uguu.se/GAQclvrM.jpg",
  "/hero-bg.jpg": "https://n.uguu.se/yevKSoYw.jpg",
  "/qet-card.jpg": "https://h.uguu.se/PJkXXMZi.jpg",
  "/4d-test-banner.jpg": "https://d.uguu.se/QRnknkCo.jpg",
  "/fsiii-banner.jpg": "https://h.uguu.se/SBvmrqiu.jpg",
  "/star-pavilion.jpg": "https://h.uguu.se/losoNBnW.jpg",
  "/org-zhihua.jpg": "https://h.uguu.se/HaYqCCKJ.jpg",
  "/org-impact.jpg": "https://d.uguu.se/phVGbTZd.jpg",
  "/org-delan.jpg": "https://n.uguu.se/XuCKawLM.jpg",
  "/org-xinjie.jpg": "https://n.uguu.se/ddVCGaCf.jpg",
  "/icons/org-zhihua.png": "https://n.uguu.se/FYOrXQYo.jpg",
  "/icons/org-impact.png": "https://d.uguu.se/uKvlOiiz.jpg",
  "/icons/org-delan.png": "https://n.uguu.se/hMeGdEUy.jpg",
  "/icons/org-xinjie.png": "https://n.uguu.se/rWLSemPS.jpg",
  "/characters/miia.jpg": "https://d.uguu.se/bEqhNKvf.jpg",
  "/characters/miia.jpeg": "https://n.uguu.se/EstvWrRl.jpg",
  "/characters/mia.jpg": "https://d.uguu.se/dBHcCNzl.jpg",
  "/characters/miya.jpg": "https://d.uguu.se/OqDJTqLi.jpg",
  "/characters/amiya.jpg": "https://h.uguu.se/MQoebJJp.jpg",
  "/characters/miacubic.jpg": "https://d.uguu.se/NBlZXEKJ.jpg",
  "/characters/lila.jpg": "https://n.uguu.se/NYyVSPRX.jpg",
  "/characters/mxy.jpg": "https://n.uguu.se/qJVyDNAP.jpg",
  "/characters/nimfa.jpg": "https://n.uguu.se/pgaRaORC.jpg",
  "/characters/nihilib.jpg": "https://d.uguu.se/NJZSQJBQ.jpg",
  "/characters/miku.jpg": "https://n.uguu.se/BSkpxanV.jpg",
  "/characters/qicheng.jpg": "https://d.uguu.se/pCtjvDbL.jpg",
  "/characters/haruka.jpg": "https://n.uguu.se/CHbwOwrn.jpg",
  "/characters/linqian.jpg": "https://h.uguu.se/NUKSPNjl.jpg",
  "/characters/ifchan.jpg": "https://d.uguu.se/rZKaqfYS.jpg",
  "/characters/hamster.jpg": "https://h.uguu.se/gyHAtRcb.jpg",
  "/characters/linshen.jpg": "https://d.uguu.se/UrUjVntG.jpg",
  "/characters/zhaozhao.jpg": "https://h.uguu.se/KDblBASn.jpg",
  "/characters/mowen.jpg": "https://n.uguu.se/pkWVigbL.jpg",
  "/characters/mimi.jpg": "https://d.uguu.se/wrVpJimX.jpg",
  "/characters/linear.jpg": "https://d.uguu.se/BvfxsvVO.jpg",
  "/characters/dora.jpg": "https://n.uguu.se/GzXTiiZW.jpg",
  "/characters/cola.jpg": "https://d.uguu.se/aHMzyHGZ.jpg",
  "/characters/mao.jpg": "https://d.uguu.se/OEyOOwib.jpg",
  "/characters/eirene.jpg": "https://n.uguu.se/utnGszwR.jpg",
  "/characters/damocles.jpg": "https://n.uguu.se/ePgoGuPe.jpg",
  "/characters/alice.jpg": "https://n.uguu.se/kpibTVlO.jpg",
  "/characters/linkmo.jpg": "https://n.uguu.se/OfEtjGdg.jpg",
  "/characters/quartus.jpg": "https://d.uguu.se/Fmthbqki.jpg",
  "/characters/zero.jpg": "https://d.uguu.se/ZyuHUevR.jpg",

  /* World Overview images */
  "/world-overview-1.png": "",
  "/world-overview-2.png": "",

  /* Timeline images */
  "/timeline-1.png": "",
  "/timeline-2.png": "",
  "/timeline-3.png": "",
  "/timeline-4.png": "",
};
