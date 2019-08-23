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