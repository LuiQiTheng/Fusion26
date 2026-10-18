import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

def create_hologram_overlay(width, height, object_mask, scan_id="SCAN_ID: MY-HERITAGE", scale_text="SCALE: 1:1"):
    """
    Creates a cyberpunk digital museum holographic overlay matching the Wayang Kulit reference style:
    - Glowing cyan wireframe polygon triangulation on part of the object
    - Concentric holographic scanning reticles
    - Technical telemetry callouts (+ coordinate markers, SCAN_ID, grid lines)
    - Luminous floating cyan particles
    """
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    cyan_bright = (0, 240, 255, 230)
    cyan_mid = (8, 180, 200, 160)
    cyan_dim = (6, 120, 140, 90)
    cyan_faint = (4, 90, 110, 50)
    
    # 1. Bounding box & telemetry of object
    # Find active region of object
    mask_arr = np.array(object_mask)
    y_indices, x_indices = np.where(mask_arr > 50)
    if len(x_indices) == 0:
        return overlay
    
    x_min, x_max = np.min(x_indices), np.max(x_indices)
    y_min, y_max = np.min(y_indices), np.max(y_indices)
    cx = (x_min + x_max) // 2
    cy = (y_min + y_max) // 2
    obj_w = x_max - x_min
    obj_h = y_max - y_min
    
    # 2. Wireframe / polygonal mesh over right or upper portion of object
    # Sample points on the right half of object
    step = max(24, int(min(obj_w, obj_h) / 16))
    grid_points = []
    for y in range(y_min, y_max, step):
        for x in range(cx - int(obj_w * 0.1), x_max, step):
            if mask_arr[y, x] > 80:
                # Add slight random jitter for natural 3D mesh look
                jx = x + random.randint(-4, 4)
                jy = y + random.randint(-4, 4)
                grid_points.append((jx, jy))
    
    # Draw triangulation lines between nearby points
    for i, p1 in enumerate(grid_points):
        neighbors = []
        for j, p2 in enumerate(grid_points):
            if i != j:
                dist = math.hypot(p1[0] - p2[0], p1[1] - p2[1])
                if dist < step * 1.6:
                    neighbors.append(p2)
        for p2 in neighbors[:3]:
            draw.line([p1, p2], fill=cyan_dim, width=1)
        # Small node at each point
        draw.rectangle([p1[0]-1, p1[1]-1, p1[0]+1, p1[1]+1], fill=cyan_mid)
    
    # 3. Concentric Holographic Scanning Reticles (Circle with crosshairs)
    reticle_r = int(min(obj_w, obj_h) * 0.32)
    rcx = int(cx + obj_w * 0.15)
    rcy = int(cy - obj_h * 0.05)
    
    # Outer dashed ring
    for deg in range(0, 360, 15):
        rad1 = math.radians(deg)
        rad2 = math.radians(deg + 9)
        x1 = rcx + reticle_r * math.cos(rad1)
        y1 = rcy + reticle_r * math.sin(rad1)
        x2 = rcx + reticle_r * math.cos(rad2)
        y2 = rcy + reticle_r * math.sin(rad2)
        draw.line([(x1, y1), (x2, y2)], fill=cyan_mid, width=1)
        
    # Inner solid ring
    inner_r = int(reticle_r * 0.6)
    draw.ellipse([rcx - inner_r, rcy - inner_r, rcx + inner_r, rcy + inner_r], outline=cyan_dim, width=1)
    
    # Corner brackets / ticks on outer ring
    for deg in [45, 135, 225, 315]:
        rad = math.radians(deg)
        tx1 = rcx + (reticle_r - 8) * math.cos(rad)
        ty1 = rcy + (reticle_r - 8) * math.sin(rad)
        tx2 = rcx + (reticle_r + 8) * math.cos(rad)
        ty2 = rcy + (reticle_r + 8) * math.sin(rad)
        draw.line([(tx1, ty1), (tx2, ty2)], fill=cyan_bright, width=2)
        
    # Subtle Crosshairs
    draw.line([(rcx - reticle_r - 15, rcy), (rcx - inner_r, rcy)], fill=cyan_dim, width=1)
    draw.line([(rcx + inner_r, rcy), (rcx + reticle_r + 15, rcy)], fill=cyan_dim, width=1)
    draw.line([(rcx, rcy - reticle_r - 15), (rcx, rcy - inner_r)], fill=cyan_dim, width=1)
    draw.line([(rcx, rcy + inner_r), (rcx, rcy + reticle_r + 15)], fill=cyan_dim, width=1)
    
    # 4. Horizontal laser scanning contour line
    scan_y = int(cy + obj_h * 0.1)
    scan_x1 = max(20, x_min - 40)
    scan_x2 = min(width - 20, x_max + 40)
    draw.line([(scan_x1, scan_y), (scan_x2, scan_y)], fill=cyan_mid, width=1)
    # Brighter centre core
    draw.line([(cx - int(obj_w*0.3), scan_y), (cx + int(obj_w*0.3), scan_y)], fill=cyan_bright, width=2)
    
    # 5. Technical CAD Telemetry Labels & Crosshairs
    try:
        font = ImageFont.truetype("arial.ttf", 11)
        small_font = ImageFont.truetype("arial.ttf", 9)
    except:
        font = ImageFont.load_default()
        small_font = font
        
    # Telemetry box at top right of object
    tb_x = min(width - 160, x_max + 15)
    tb_y = max(30, y_min + 20)
    draw.text((tb_x, tb_y), scan_id, fill=cyan_bright, font=font)
    draw.text((tb_x, tb_y + 14), scale_text, fill=cyan_mid, font=small_font)
    draw.text((tb_x, tb_y + 26), "RES: 0.15mm | OPT_CALIB", fill=cyan_dim, font=small_font)
    # Leader line to object
    draw.line([(tb_x - 5, tb_y + 6), (x_max - 5, tb_y + 6)], fill=cyan_dim, width=1)
    draw.ellipse([x_max - 7, tb_y + 4, x_max - 3, tb_y + 8], fill=cyan_bright)
    
    # Precision crosshairs around the object
    cross_pts = [
        (x_min - 15, y_min + 30),
        (x_max + 20, y_max - 40),
        (cx - 60, y_min - 15),
        (cx + 60, y_max + 20)
    ]
    for px, py in cross_pts:
        draw.line([(px - 6, py), (px + 6, py)], fill=cyan_dim, width=1)
        draw.line([(px, py - 6), (px, py + 6)], fill=cyan_dim, width=1)
        
    # 6. Floating luminous data particles
    for _ in range(40):
        # Sample around the object boundary
        px = random.randint(max(10, x_min - 40), min(width - 10, x_max + 40))
        py = random.randint(max(10, y_min - 30), min(height - 10, y_max + 30))
        # Don't place deep inside solid object
        if mask_arr[py, px] < 200 or random.random() < 0.2:
            r_sz = random.choice([1, 1, 2, 2, 3])
            c_fill = random.choice([cyan_bright, cyan_mid, cyan_dim])
            draw.ellipse([px - r_sz, py - r_sz, px + r_sz, py + r_sz], fill=c_fill)
            
    # Apply soft Gaussian glow blur to a duplicate and blend
    glow = overlay.filter(ImageFilter.GaussianBlur(radius=2))
    result = Image.alpha_composite(glow, overlay)
    return result

def process_heritage_artifact(isolated_png_path, out_png_path, scan_id, scale_text, target_size=(1200, 896)):
    """
    Composites the isolated object with museum lighting and cyan hologram scan overlay.
    Outputs a pristine, transparent RGBA PNG.
    """
    im = Image.open(isolated_png_path).convert("RGBA")
    
    # 1. Enhance the cultural object itself: contrast, sharpness, subtle vibrancy
    r, g, b, a = im.split()
    rgb = Image.merge("RGB", (r, g, b))
    
    enhancer = ImageEnhance.Contrast(rgb)
    rgb = enhancer.enhance(1.15)
    
    enhancer = ImageEnhance.Sharpness(rgb)
    rgb = enhancer.enhance(1.25)
    
    enhancer = ImageEnhance.Color(rgb)
    rgb = enhancer.enhance(1.12)
    
    im_enhanced = Image.merge("RGBA", (*rgb.split(), a))
    
    # 2. Crop tightly to visible pixels
    bbox = im_enhanced.getbbox()
    if bbox:
        im_enhanced = im_enhanced.crop(bbox)
        
    # 3. Fit gracefully into target_size with museum margins
    tw, th = target_size
    max_w = int(tw * 0.78)
    max_h = int(th * 0.85)
    
    im_enhanced.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    
    # Create final transparent canvas
    final_canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    
    # Centre object
    ox = (tw - im_enhanced.width) // 2
    oy = (th - im_enhanced.height) // 2
    final_canvas.paste(im_enhanced, (ox, oy), im_enhanced)
    
    # 4. Generate & composite cyan hologram scan layer
    obj_mask = final_canvas.split()[-1]
    hologram = create_hologram_overlay(tw, th, obj_mask, scan_id=scan_id, scale_text=scale_text)
    
    final_result = Image.alpha_composite(final_canvas, hologram)
    final_result.save(out_png_path, "PNG", optimize=True)
    print(f"Successfully generated {out_png_path}: {final_result.size}")

if __name__ == "__main__":
    test_src = r"c:\Users\ASUS\Documents\GitHub\Fusion26\scratch\test_terabai_isolated.png"
    test_out = r"c:\Users\ASUS\Documents\GitHub\Fusion26\scratch\test_terabai_hologram.png"
    process_heritage_artifact(test_src, test_out, "SCAN_ID: SWK-TERABAI-01", "SCALE: 1100mm")
