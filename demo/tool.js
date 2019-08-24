/**
 * 获取某个位置的通道值
 */
function getChannels(mat, row, col) {
  let channel = [];
  let len = mat.channels();
  let no = row * mat.cols * len + col * len;
  for (let i = 0; i < len; i++) {
    channel.push(mat.data[no + i]);
  }
  return channel;
}

/**
 * 获取图像中各通道的最小值和最小值
 */
function getMinMaxChannels(mat) {
  let mins = [];
  let maxs = [];
  let len = mat.channels();
  let planes = new cv.MatVector()
  cv.split(mat, planes)

  for (let i = 0; i < len; i++) {
    let channel = planes.get(i);
    let loc = cv.minMaxLoc(channel)
    mins.push(getChannels(channel, loc.minLoc.y, loc.minLoc.x)[0]);
    maxs.push(getChannels(channel, loc.maxLoc.y, loc.maxLoc.x)[0]);
  }

  planes.delete();

  return {
    mins: mins,
    maxs: maxs
  };
}