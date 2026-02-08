# BGM 预设

将 4 首 WAV 转为 MP3 并命名为 `-Cynthia xmyri` 后放入此目录，即可在「声音设置」中作为预设选择。

## 转换方式

1. 安装 [ffmpeg](https://ffmpeg.org/) 并加入 PATH。
2. 将 4 个 WAV 文件放入项目根目录下的 `bgm-source` 文件夹（或任意目录）。
3. 在项目根目录执行：
   ```bash
   node scripts/convert-bgm-wav-to-mp3.mjs ./bgm-source
   ```
   或指定输出目录：
   ```bash
   node scripts/convert-bgm-wav-to-mp3.mjs "C:\Users\xxx\Downloads" ./public/sounds/bgm
   ```

## 预期输出文件名

- `cold-background-Cynthia-xmyri.mp3`
- `deep-sleep-wip-Cynthia-xmyri.mp3`
- `reboot-background-wip-Cynthia-xmyri.mp3`
- `absent-wip-Cynthia-xmyri.mp3`

放置完成后刷新应用即可在 BGM 下拉框中选择预设。
