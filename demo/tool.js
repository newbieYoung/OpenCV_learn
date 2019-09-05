/**
 * 卷积
 */
function convolution(mat, kernel) {
  let len = mat.channels();
  let row1 = mat.rows;
  let col1 = mat.cols;

  let row2 = kernel.rows;
  let col2 = kernel.cols;

  /**
   * 一般而言卷积核所有元素之和等于1；
   * 如果不等于1，大于 1 时生成的图片亮度会增加，小于 1 时生成的图片亮度会降低。
   */
  let eles = [];
  let sums = [0, 0, 0, 0];
  for (let z = 0; z < len; z++) {
    for (let i = 0; i < row2; i++) {
      for (let j = 0; j < col2; j++) {
        let no = i * row2 * len + j * len;
        sums[z] += kernel.data[no + z];
        eles[no + z] = kernel.data[no + z];
      }
    }
  }
  for (let z = 0; z < len; z++) {
    for (let i = 0; i < row2; i++) {
      for (let j = 0; j < col2; j++) {
        let no = i * row2 * len + j * len;
        eles[no + z] = eles[no + z] / sums[z];
      }
    }
  }

  //卷积核中心
  let rowC = (row2 - 1) / 2;
  let colC = (col2 - 1) / 2;

  //卷积计算
  let result = mat.clone();
  for (let r = 0; r < row1; r++) {
    for (let c = 0; c < col1; c++) {
      let rowStart = r - rowC;
      let colStart = c - colC;
      let noCur = r * row1 * len + c * len;

      for (let t = 0; t < len; t++) { //透明通道不参与计算
        let sum = 0;
        if (t == len - 1) { //透明通道不参与计算
          sum = 255;
        } else {
          for (let i = 0; i < row2; i++) {
            for (let j = 0; j < col2; j++) {
              let r1 = rowStart + i;
              let c1 = colStart + j;

              let n1 = r1 * row1 * len + c1 * len;
              let v1 = mat.data[n1 + t];
              v1 = v1 == null ? 0 : v1; //不存在使用常量 0 代替

              let r2 = row2 - 1 - i; //卷积核旋转180度
              let c2 = col2 - 1 - j;

              let n2 = r2 * row2 * len + c2 * len;
              let v2 = eles[n2 + t];

              sum += v1 * v2;
            }
          }
        }
        result.data[noCur + t] = sum;
      }
    }
  }

  return result;
}

/**
 * 膨胀
 */
function selfDilate(mat, kernel) {
  let conv = convolution(mat, kernel); //卷积
  for (let i = 0; i < conv.data.length; i++) {
    if (conv.data[i] < mat.data[i]) { //取局部最大值
      conv.data[i] = mat.data[i];
    }
  }
  return conv;
}

/**
 * 腐蚀
 */
function selfErode(mat, kernel) {
  let conv = convolution(mat, kernel); //卷积
  for (let i = 0; i < conv.data.length; i++) {
    if (conv.data[i] > mat.data[i]) { //取局部最小值
      conv.data[i] = mat.data[i];
    }
  }
  return conv;
}

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