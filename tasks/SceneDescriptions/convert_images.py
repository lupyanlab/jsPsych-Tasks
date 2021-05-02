from PIL import Image
from os import listdir

files = sorted(listdir())
jpegs = [file for file in files if file.endswith('.jpg')]

for jpeg in jpegs:
    img = Image.open(jpeg)
    img = img.resize((img.width // 8, img.height // 8), resample=Image.LANCZOS)
    img.save(jpeg.replace('.jpg', '.png'))
    print(f'converted {jpeg} to .png')
