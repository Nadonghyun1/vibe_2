from pathlib import Path
from PIL import Image, ImageOps
import json
root=Path(__file__).parent
src=Path('E:/_노가정/02_이미지')
items=[
('쭈꾸미볶음 (6).png','octopus','직화 쭈꾸미볶음',11000,'대표 메뉴','공깃밥 포함','직화로 볶아낸 쭈꾸미를 든든한 한 끼로.',2),
('파불고기 (1).png','bulgogi','파불고기',13000,'대표 메뉴','공깃밥 별도','식사로도, 술안주로도 인기 있는 메뉴.',2),
('쭈삼불고기2.png','jussam','쭈삼불고기',13000,'대표 메뉴','공깃밥 별도','쭈꾸미와 삼겹살을 함께 즐기는 한 접시.',2),
('찜갈비1280-1.jpg','spicy-ribs','동인동 매운찜갈비',22000,'대표 메뉴','공깃밥 별도','노가정의 시작을 함께한 창업 메뉴.',2),
('_오리삼합.png','duck','오리삼합철판구이',18000,'대표 메뉴','공깃밥 별도','더덕·오리·쭈꾸미의 조화로운 만남.',2),
('직화쭈꾸미철판볶음 (1).png','iron-octopus','쭈꾸미철판볶음',16000,'대표 메뉴','공깃밥 별도','쭈꾸미·삼겹살·통새우를 철판 위에.',2),
('석갈비.jpg','ribs','석갈비',17000,'대표 메뉴','공깃밥 별도','함께 나누기 좋은 갈비 한 상.',2),
('직접 수제로 만든통등심돈까스-7500원 (옛날 경양식 스타일,비법데미그라스 소스가 일품 포호아에서 직접 만듭니다).jpg','cutlet','수제돈까스',11000,'식사 메뉴','밥 포함','한 끼 든든하게 즐기는 수제돈까스.',1),
('03-통모짜렐라치즈돈까스-9000원.jpg','cheese','통모짜렐라치즈돈까스',13000,'식사 메뉴','밥 포함','통모짜렐라 치즈를 담은 돈까스.',1),
('원기충전쌀국수(차돌양지+홍두깨+스지를 한번에!! 4시간이상 우려낸 명품육수).jpg','pho','소고기쌀국수',10000,'식사 메뉴','','따뜻한 국물과 소고기를 함께.',1),
('RKFQLXKD.jpg','soup','수제 갈비탕',14000,'식사 메뉴','공깃밥 포함','갈비와 따뜻한 국물로 채우는 한 끼.',1),
('가쓰오로 직접 우려낸 냉소바(판매가 6300원).jpg','soba','메밀소바',10000,'식사 메뉴','','시원하게 즐기는 메밀소바.',1),
('고르곤졸라.jpg','pizza','고르곤졸라피자',10000,'곁들임','','함께 나누는 치즈 피자.',1),
('피자+새우.jpg','pizza-shrimp','피자·새우튀김 세트',15000,'곁들임','','피자와 새우튀김을 함께 즐기는 세트.',1),
('왕만두.jpg','dumpling','메밀왕만두',7000,'곁들임','4개','식사에 곁들이기 좋은 왕만두.',1),
('전병사진.jpeg','roll','메밀전병',7000,'곁들임','2개','함께 나누기 좋은 메밀전병.',1),
]
out=root/'public'/'images';out.mkdir(parents=True,exist_ok=True)
data=[]
for filename,slug,name,price,category,note,desc,minimum in items:
 im=ImageOps.exif_transpose(Image.open(src/filename)).convert('RGB');im.thumbnail((1400,1400));im.save(out/(slug+'.webp'),'WEBP',quality=86)
 data.append(dict(slug=slug,name=name,price=price,category=category,note=note,description=desc,minimum=minimum,image='/images/'+slug+'.webp'))
for name in ['interior-main-retouched','interior-group-retouched','exterior-retouched']:
 im=Image.open(out/(name+'.png')).convert('RGB');im.thumbnail((1680,1100));im.save(out/(name+'.webp'),'WEBP',quality=87)
(root/'public'/'menu.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(data),'menu photos and 3 venue photos')
