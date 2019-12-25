/**
 * 卷积
 * data     卷积核+矩阵数据
 * kerRows  卷积核行数
 * kerCols  卷积核列数
 * matRows  矩阵行数
 * matCols  矩阵列数
 * len      颜色通道数
 * ----
 * 对于图片来说行数即高度、列数即宽度
 */
function convolution(data, kerRows, kerCols, matRows, matCols, len) {
  //拆分矩阵数据
  let kerLen = kerRows * kerCols * len;
  let kerMat = data.slice(0, kerLen);

  let matLen = matRows * matCols * len;
  let matMat = data.slice(kerLen, matLen + kerLen);

  //暂不考虑非奇数尺寸卷积核
  if (kerRows % 2 != 1 || kerCols % 2 != 1) {
    return [];
  }

  //一般而言卷积核所有元素之和等于1；否则大于1时生成的图片亮度会增加，小于1时生成的图片亮度会降低
  let eles = [];
  let sums = [0.0, 0.0, 0.0, 0.0];
  for (let z = 0; z < len; z++) {
    for (let i = 0; i < kerRows; i++) {
      for (let j = 0; j < kerCols; j++) {
        let no = (i * kerCols + j) * len;
        sums[z] += kerMat[no + z];
        eles[no + z] = kerMat[no + z];
      }
    }
  }
  for (let z = 0; z < len; z++) {
    for (let i = 0; i < kerRows; i++) {
      for (let j = 0; j < kerCols; j++) {
        let no = (i * kerCols + j) * len;
        eles[no + z] = eles[no + z] / sums[z];
      }
    }
  }

  //卷积核中心
  let cRow = (kerRows - 1) / 2;
  let cCol = (kerCols - 1) / 2;

  //卷积计算
  let result = new Array(matLen);
  for (let r = 0; r < matRows; r++) {
    let rs = r - cRow;
    for (let c = 0; c < matCols; c++) {
      let cs = c - cCol;
      let noCur = (r * matCols + c) * len;
      for (let z = 0; z < len; z++) {
        let sum = 0;
        if (z == len - 1 && len >= 4) {
          //透明通道不参与计算
          sum = matMat[noCur + z];
        } else {
          for (let i = 0; i < kerRows; i++) {
            let r1 = rs + i;
            for (let j = 0; j < kerCols; j++) {
              let c1 = cs + j;

              let n1 = (r1 * matCols + c1) * len;
              let v1 = 0; //超出范围使用常量0代替
              if (r1 >= 0 && r1 < matRows && c1 >= 0 && c1 < matCols) {
                v1 = matMat[n1 + z];
              }

              let r2 = kerRows - 1 - i; //卷积核旋转180度
              let c2 = kerCols - 1 - j;

              let n2 = (r2 * kerCols + c2) * len;
              let v2 = eles[n2 + z];

              sum += v1 * v2;
            }
          }
        }
        result[noCur + z] = sum;
      }
    }
  }

  return result;
}

/**
 * 腐蚀
 */
function erode(data, kerRows, kerCols, matRows, matCols) {
  let len = 4;
  let kerLen = kerRows * kerCols * len;
  let matLen = matRows * matCols * len;
  let matMat = data.slice(kerLen, matLen + kerLen);

  let conv = convolution(data, kerRows, kerCols, matRows, matCols, 4); //卷积

  for (let i = 0; i < conv.length; i++) {
    if (conv[i] > matMat[i]) {
      //取局部最小值
      conv[i] = matMat[i];
    }
  }

  return conv;
}

/**
 * 膨胀
 */
function dilate(data, kerRows, kerCols, matRows, matCols) {
  let len = 4;
  let kerLen = kerRows * kerCols * len;
  let matLen = matRows * matCols * len;
  let matMat = data.slice(kerLen, matLen + kerLen);

  let conv = convolution(data, kerRows, kerCols, matRows, matCols, 4); //卷积

  for (let i = 0; i < conv.length; i++) {
    if (conv[i] < matMat[i]) {
      //取局部最大值
      conv[i] = matMat[i];
    }
  }

  return conv;
}