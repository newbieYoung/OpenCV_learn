/**
 * 获取某个位置的通道值
 */
function getChannels(mat, row, col) {
  let channel = []
  let len = mat.channels()
  let no = row * mat.cols * len + col * len
  for (let i = 0; i < len; i++) {
    channel.push(mat.data[no + i])
  }
  return channel
}

/**
 * 获取图像中各通道的最小值和最小值
 */
function getMinMaxChannels(mat) {
  let mins = []
  let maxs = []
  let len = mat.channels()
  let planes = new cv.MatVector()
  cv.split(mat, planes)

  for (let i = 0; i < len; i++) {
    let channel = planes.get(i)
    let loc = cv.minMaxLoc(channel)
    mins.push(getChannels(channel, loc.minLoc.y, loc.minLoc.x)[0])
    maxs.push(getChannels(channel, loc.maxLoc.y, loc.maxLoc.x)[0])
  }

  planes.delete()

  return {
    mins: mins,
    maxs: maxs
  }
}

/**
 * 获取图像中各通道的最小值和最大值
 */
function getMinMaxChannelsWithOutZero(mat) {
  let mins = []
  let maxs = []
  let len = mat.channels()
  let planes = new cv.MatVector()
  cv.split(mat, planes)

  for (let i = 0; i < len; i++) {
    let channel = planes.get(i)
    let min = 255
    let max = 255
    for (let j = 1; j < channel.data.length; j++) {
      if (channel.data[j] < min && channel.data[j] > 0) {
        min = channel.data[j]
      }
      if (channel.data[j] > max && channel.data[j] > 0) {
        max = channel.data[j]
      }
    }
    mins.push(min)
    maxs.push(max)
  }

  planes.delete()

  return {
    mins: mins,
    maxs: maxs
  }
}

/**
 * 过滤图像中的各通道
 */
function filterChannels(mat, mins, maxs, type) {
  let len = mat.channels()
  let planes = new cv.MatVector()
  cv.split(mat, planes)

  for (let i = 0; i < len; i++) {
    /**
     * 阀值化
     * threshold( src,dst, thresh, maxval, type )
     * 参数说明：
     * src 源图像
     * dst 输出图像
     * thresh 门限值
     * maxval 最大值
     * type 函数类型
     * cv.THRESH_TOZERO 表示如果目标值大于门限值则取目标值否则取 0
     */
    cv.threshold(
      planes.get(i),
      planes.get(i),
      mins[i] - 1,
      maxs[i] - 1,
      type //cv.THRESH_TOZERO
    )
  }
  cv.merge(planes, mat)

  planes.delete()
}

/**
 * 绘制边框
 */
function getContours(src) {
  let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3)
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0)
  cv.threshold(src, src, 180, 200, cv.THRESH_BINARY)
  let contours = new cv.MatVector()
  let hierarchy = new cv.Mat()
  cv.findContours(
    src,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE
  )
  for (let i = 0; i < contours.size(); ++i) {
    let color = new cv.Scalar(255, 255, 255)
    cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100)
  }
  return dst
}
