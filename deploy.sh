#!/bin/bash
# 创建部署文件列表
FILES='['
for file in $(find dist -type f); do
  sha=$(sha1sum "$file" | cut -d' ' -f1)
  size=$(stat -c%s "$file")
  FILES="${FILES}{\"sha\":\"${sha}\",\"size\":${size},\"file\":\"${file}\"},"
done
FILES="${FILES%,}]"
echo "{\"files\":${FILES}}" > /tmp/files.json
echo "文件列表已生成"
