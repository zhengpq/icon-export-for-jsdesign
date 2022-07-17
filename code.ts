// 详细内容见开发者文档：https://js.design/developer-doc/Guide/2.Development/4.manifest.json

// 打开 GUI 用户界面 "ui.html".
// jsDesign.showUI(__html__);

// jsDesign.ui.onmessage = msg => {

//   if (msg.type === 'create-rectangles') {
//     const nodes: SceneNode[] = [];
//     for (let i = 0; i < msg.count; i++) {
//       const rect = jsDesign.createRectangle();
//       rect.x = i * 150;
//       rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
//       jsDesign.currentPage.appendChild(rect);
//       nodes.push(rect);
//     }
//     jsDesign.currentPage.selection = nodes;
//     jsDesign.viewport.scrollAndZoomIntoView(nodes);
//   }

//   // 关闭插件
//   jsDesign.closePlugin();
// };

import svgToBase64 from 'svg64'

const svgToDataURL = (fileContent) => {
  const bg = fileContent.replace('<svg', (fileContent.indexOf('xmlns') ? '<svg' : '<svg xmlns="http://www.w3.org/2000/svg"'))
    .replace(/"/g, '\'')
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/{/g, '%7B')
    .replace(/}/g, '%7D')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ')
  return `data:image/svg+xml,${bg}`
}

// 节点不展示，用于后面进行 textarea 节点的插入
jsDesign.showUI(__html__, {width: 0, height: 0, title: ''})

const formateData = (type: string, selections: readonly SceneNode[]) => {
  const promiseArray = selections.map((item: SceneNode) => {
    return item.exportAsync({
      format: 'SVG'
    })
  })
  Promise.all(promiseArray).then((values) => {
    const svgDataURL = values.map((item: Uint8Array) => {
      if (type === 'dataurl') {
        return `background-image: url("${svgToDataURL(String.fromCharCode.apply(null, item))}");`
      }
      if (type === 'base64') {
        return `background-image: url("${svgToBase64(String.fromCharCode.apply(null, item))}");`
      }
    })
    jsDesign.ui.postMessage({ pluginMessage: { type: 'copy', text: svgDataURL.join('\n')} }, { origin: '*'})
  }).catch((err: string) => {
    jsDesign.notify(err)
    jsDesign.closePlugin()
  })
}

// 监听插件的运行
jsDesign.on('run', (event) => {
  const selections = jsDesign.currentPage.selection
  if ( selections.length === 0) {
    jsDesign.notify('请先选择要导出的节点')
    return
  }
  const { command } = event
  formateData(command, selections)
})

// 监听复制事件
jsDesign.ui.onmessage = (event: any) => {
  const { type } = event
  switch (type) {
    case 'success':
      jsDesign.notify('copy successfully')
      jsDesign.closePlugin()
      break;
    default:
      jsDesign.notify('copy fail')
      jsDesign.closePlugin()
      break;
  }
}
