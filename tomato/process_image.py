from PIL import Image, ImageEnhance
import os

def reduce_brightness(input_path, output_path, brightness_factor=0.3):
    """
    降低图片亮度
    
    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径  
        brightness_factor: 亮度因子，0.3表示保留30%的亮度（降低70%）
    """
    try:
        # 打开图片
        with Image.open(input_path) as img:
            print(f"原图片尺寸: {img.size}")
            print(f"原图片模式: {img.mode}")
            
            # 创建亮度增强器
            enhancer = ImageEnhance.Brightness(img)
            
            # 调整亮度（0.3表示降低到原来的30%，即降低70%）
            darker_img = enhancer.enhance(brightness_factor)
            
            # 保存处理后的图片
            darker_img.save(output_path, quality=95)
            print(f"成功保存暗色版本到: {output_path}")
            
    except FileNotFoundError:
        print(f"错误: 找不到文件 {input_path}")
    except Exception as e:
        print(f"处理图片时出错: {e}")

if __name__ == "__main__":
    input_file = "1.png"
    output_file = "2.png"
    
    # 检查输入文件是否存在
    if not os.path.exists(input_file):
        print(f"错误: {input_file} 不存在!")
        print("请确保 1.png 文件在当前目录中")
    else:
        print("开始处理图片...")
        print(f"输入文件: {input_file}")
        print(f"输出文件: {output_file}")
        print("亮度设置: 保留30%（降低70%）")
        print("-" * 40)
        
        # 处理图片
        reduce_brightness(input_file, output_file, brightness_factor=0.3)
        
        print("-" * 40)
        print("处理完成！")
        print("现在可以在CSS中使用2.png作为深色模式的背景图片") 