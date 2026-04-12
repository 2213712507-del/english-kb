#!/usr/bin/env python3
"""生成英语知识库 PWA 图标（黄色背景 + 文字）"""
import struct, zlib, math

def create_png(size, bg_color, text_lines, text_color=(33,33,33)):
    """用纯 Python 生成 PNG，不依赖第三方库"""
    width = height = size
    
    # 创建像素数组
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            # 圆角矩形 mask
            r = size * 0.18  # 圆角半径比例
            cx, cy = x - width/2, y - height/2
            hw, hh = width/2 - r, height/2 - r
            
            # 是否在圆角矩形内
            dx = max(0, abs(cx) - hw)
            dy = max(0, abs(cy) - hh)
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist <= r:
                row.extend(bg_color)
            else:
                row.extend([255, 255, 255, 0])  # 透明
        pixels.append(row)
    
    # 绘制文字区域（简单矩形块模拟）
    # 在图标中央绘制简单的 "英" 字样
    center_x, center_y = width // 2, height // 2
    
    # 绘制书本图形（简化版）
    book_w = int(size * 0.45)
    book_h = int(size * 0.38)
    bx1 = center_x - book_w // 2
    bx2 = center_x + book_w // 2
    by1 = center_y - book_h // 2 - int(size * 0.05)
    by2 = center_y + book_h // 2 - int(size * 0.05)
    
    line_t = max(2, size // 30)
    
    for y in range(height):
        for x in range(width):
            # 书本外框
            if (bx1 <= x <= bx2 and (by1 <= y <= by1 + line_t or by2 - line_t <= y <= by2)):
                pixels[y][x*4:x*4+4] = list(text_color) + [255]
            elif (by1 <= y <= by2 and (bx1 <= x <= bx1 + line_t or bx2 - line_t <= x <= bx2)):
                pixels[y][x*4:x*4+4] = list(text_color) + [255]
            # 书脊线
            elif (by1 <= y <= by2 and center_x - line_t//2 <= x <= center_x + line_t//2):
                pixels[y][x*4:x*4+4] = list(text_color) + [255]
            # 书页线条
            elif (bx1 + line_t < x < center_x - line_t//2):
                line_spacing = (by2 - by1) // 5
                for li in range(1, 4):
                    ly = by1 + li * line_spacing
                    if ly - line_t//2 <= y <= ly + line_t//2:
                        pixels[y][x*4:x*4+4] = list(text_color) + [200]
    
    # 转换为 PNG bytes
    def pack_row(row):
        # RGBA
        return bytes([0] + [b for b in row])
    
    raw = b''.join(pack_row(row) for row in pixels)
    compressed = zlib.compress(raw, 9)
    
    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        crc = zlib.crc32(name + data) & 0xffffffff
        return c + struct.pack('>I', crc)
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

# 黄色背景 RGBA
bg = (255, 214, 0, 255)

sizes = [120, 152, 180, 192, 512]
for s in sizes:
    png_data = create_png(s, bg, [], (33, 33, 33))
    with open(f'icon-{s}.png', 'wb') as f:
        f.write(png_data)
    print(f'Generated icon-{s}.png ({len(png_data)} bytes)')

print('All icons generated!')
