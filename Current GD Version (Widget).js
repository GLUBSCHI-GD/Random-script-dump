/*
 * @fileoverview
 * Widget that shows the current version of GD and whether or not 2.2 has released yet
 *
 * @author GLUBSCHI
 */

const widget = new ListWidget();
const wv = new WebView();
const appInfo = await getAppInfo();
const appURL = 'itms-apps://itunes.apple.com/app/id625334537';

const appIcon = await getAppIcon(appInfo?.artworkUrl512);
const appVersion = appInfo ? appInfo?.version : '?.?';
const updateReleased = appVersion == "2.2";
const finalIcon = await grayscale(appIcon, updateReleased ? 0 : 90);

// set a background gradient
const bgGradient = new LinearGradient();
if (updateReleased) {
  bgGradient.locations = [0, 0.6, 1]
  bgGradient.colors = [
    new Color('F1EB5A'),
    new Color('E7AE54'),
    new Color('ED8834')
  ]
} else {
  bgGradient.locations = [0, 1]
  bgGradient.colors = [
    new Color('141414'),
    new Color('13233F')
  ]
}
widget.backgroundGradient = bgGradient;

// set padding
widget.setPadding(10, 10, 10, 10);

// display version number
const versionElContainer = widget.addStack();
versionElContainer.setPadding(2, updateReleased ? 2 : 7, 2, 2);
versionElContainer.size = new Size(140, 0)

const versionEl = versionElContainer.addText(appVersion)
versionEl.minimumScaleFactor = 5;
versionEl.textColor = Color.white();
versionEl.font = Font.blackMonospacedSystemFont(45);

// display app icon
const iconElContainer = widget.addStack();
iconElContainer.setPadding(2, 25, 2, 2);

const iconEl = iconElContainer.addImage(finalIcon);
iconEl.cornerRadius = 16;

// extra special effects if 2.2 has been released
if (updateReleased) {
  versionEl.shadowColor = new Color('ffffaa');
  versionEl.shadowRadius = 3;
  versionEl.shadowOffset = new Point(0, 6)
  versionEl.url = appURL;
  
  iconEl.url = appURL;
}

if (!config.runsInWidget) {
  widget.presentSmall();
} else {
  Script.setWidget(widget);
}

return;



async function getAppInfo () {
  const req = new Request('https://itunes.apple.com/lookup?id=625334537');
  req.method = 'GET';
  
  const appInfo = await req.loadJSON();
  
  if (!appInfo?.resultCount) {
    logError("Couldn't find Geometry Dash in the App Store!")
    return {};
  }
  
  return appInfo.results[0];
}

async function getAppIcon (artworkURL = 'https://is1-ssl.mzstatic.com/image/thumb/Purple118/v4/b6/5d/7b/b65d7be5-e14a-433f-bb53-8cc2407e6199/AppIcon-1x_U007emarketing-85-220-9.png/512x512bb.jpg') {
  const req = new Request(artworkURL);
  req.method = 'GET';
  return await req.loadImage();
}

// grayscale function with a few added things
async function grayscale (image, percentage = 100) {
  const height = image.size.height;
  const width = image.size.width;
  
  const imageData = Data.fromPNG(image);
  const imageDataURL = "data:image/png;base64," + imageData.toBase64String();
  
  let grayscaleImg;
  
  const html = `
    <head>
      <script src="https://cdn.jsdelivr.net/npm/context-filter-polyfill/dist/index.min.js"></script>
    </head>
    <body>
      <canvas width="${width}" height="${height}"></canvas>
      <script>
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          
          // grayscale
          ctx.filter = "grayscale(${percentage}%)";
          
          ctx.drawImage(img, 0, 0);
          
          // add current date
          const date = new Date()
          const timeString = '(' + date.toTimeString().split(' ')[0] + ')';
          ctx.fillStyle = 'fff';
          ctx.font = 'bold ' + height/6 + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = "black";
          ctx.shadowBlur = 20;
          ctx.fillText(timeString, width/2, height-(height/9));
          
          // return image data
          completion && completion(canvas.toDataURL())
        }
        img.src="${imageDataURL}";
      </script>
    </body>
  `
  await wv.loadHTML(html);
  await wv.evaluateJavaScript(`setTimeout(() => {completion(canvas.toDataURL())}, 100)`, !0)
    .then(dataURL => {
      const base64String = dataURL.slice(dataURL.indexOf(',')+1);
      grayscaleImg = Image.fromData(Data.fromBase64String(base64String))
  })
  
  return grayscaleImg;
}
