# Virtual Try-On Prompt 版本对比分析

## 版本历史

### 🥇 第一版（commit 4237a76）- 效果最好 ✅

```typescript
const tryOnPrompt = `
You are an expert at virtual glasses try-on. I will provide you with two images:
1. A person's face photo
2. A pair of glasses

Please create a photorealistic image where the glasses are naturally placed on the person's face.

Requirements:
- Position the glasses correctly on the nose bridge and ears
- Match the perspective and angle of the face
- Adjust the size of the glasses to fit the face proportionally
- Match the lighting conditions of the original photo
- Ensure the glasses look natural and realistic
- Preserve the person's facial features and expression
- Make sure the glasses don't obscure important facial features unnaturally

${prompt}
`
```

**特点**:
- ✅ 简洁明了
- ✅ 角色定位："You are an expert at virtual glasses try-on"
- ✅ 任务描述："create a photorealistic image"
- ✅ 要求列表简单清晰
- ✅ 强调"Preserve the person's facial features and expression"
- ✅ 没有过度强调"不要改变原图"

---

### 🥈 第二版（commit bbc2872）- 解决"只生成眼镜"问题

```typescript
const tryOnPrompt = `
I need you to create a virtual try-on image by compositing two images together.

INPUT IMAGES:
- First image: A person's face/portrait
- Second image: A pair of glasses

YOUR TASK:
Create a single photorealistic image showing the PERSON from the first image WEARING the GLASSES from the second image.

CRITICAL REQUIREMENTS:
1. START with the person's face from the first image as your base
2. PLACE the glasses from the second image ONTO the person's face
3. The glasses must be positioned on the nose bridge, aligned with the eyes
4. Scale the glasses proportionally to fit the face size
5. Match the perspective and angle of the person's face
6. Blend lighting, shadows, and reflections naturally
7. Keep all facial features, skin tone, hair, and background from the person's image
8. The result must look like a real photograph of this person wearing these glasses

WHAT NOT TO DO:
- Do NOT generate only the glasses
- Do NOT generate a different person
- Do NOT change the person's appearance except for adding the glasses

OUTPUT:
A single photorealistic composite image of the person wearing the glasses.

${prompt}
`
```

**特点**:
- ✅ 解决了"只生成眼镜"的问题
- ✅ 更详细的步骤说明
- ⚠️ 开始强调"Keep all facial features, skin tone, hair, and background"
- ⚠️ 添加了"WHAT NOT TO DO"部分
- ⚠️ 可能过于强调"composite"，导致 AI 理解为"合成新图"

---

### 🥉 第三版（commit 5fb6641）- 当前版本，过度强调保持原图

```typescript
const tryOnPrompt = `
You are a professional photo editor. Your task is to overlay glasses onto a person's photo WITHOUT changing the original photo.

INPUT IMAGES:
- Image 1: Original person's photo (MUST remain 100% unchanged)
- Image 2: Glasses to overlay

TASK:
Add the glasses from Image 2 onto the person in Image 1 as an overlay layer, like Photoshop layers.

CRITICAL - PRESERVE ORIGINAL IMAGE:
1. Keep the EXACT original photo of the person - do NOT regenerate or redraw the face
2. Keep EXACT skin texture, pores, wrinkles, blemishes from original
3. Keep EXACT hair style, color, and texture from original
4. Keep EXACT background, lighting, and colors from original
5. Keep EXACT facial expression and features from original
6. The ONLY change should be adding the glasses on top

GLASSES PLACEMENT:
1. Position glasses on the nose bridge, aligned with eyes
2. Scale glasses proportionally to fit the face size
3. Match the angle and perspective of the face
4. Add natural shadows under the glasses frames
5. Add subtle reflections on the lenses if appropriate

BLENDING:
1. Blend only the edges of the glasses frames with the face
2. Make shadows look natural
3. Do NOT blur or modify the original face/background

WHAT NOT TO DO:
- Do NOT regenerate or redraw the person's face
- Do NOT change skin tone, texture, or any facial features
- Do NOT change hair, clothing, or background
- Do NOT apply filters or effects to the original image
- Do NOT generate only the glasses without the person

OUTPUT:
The EXACT original photo with glasses overlaid on top, as if using Photoshop layers.

${prompt}
`
```

**特点**:
- ❌ 过度强调"EXACT"、"100% unchanged"、"do NOT regenerate"
- ❌ 可能限制了 AI 的创造性
- ❌ 太多"WHAT NOT TO DO"可能让 AI 困惑
- ❌ "Photoshop layers"概念可能不适合生成式 AI

---

## 🔍 分析：为什么第一版效果最好？

### 1. **平衡的指令**
第一版在"保持原图"和"自然合成"之间找到了平衡：
- 说了"Preserve the person's facial features and expression"
- 但没有过度强调"EXACT"、"100% unchanged"
- 给了 AI 足够的灵活性来做自然的融合

### 2. **角色定位恰当**
- "You are an expert at virtual glasses try-on" - 专注于任务本身
- 不是"photo editor"（暗示不要改变原图）
- 不是"compositor"（暗示合成新图）

### 3. **简洁清晰**
- 要求列表简单（7 条）
- 没有过多的"CRITICAL"、"EXACT"等强调词
- 没有冗长的"WHAT NOT TO DO"列表

### 4. **自然的语言**
- "naturally placed" - 强调自然
- "photorealistic" - 强调真实感
- "Preserve" 而不是 "Keep EXACT" - 更温和的表达

### 5. **信任 AI 的能力**
- 第一版相信 AI 能理解"preserve facial features"
- 后续版本过度指导，反而限制了 AI 的表现

---

## 💡 建议：回到第一版，微调优化

基于分析，建议使用第一版作为基础，只做小幅优化：

```typescript
const tryOnPrompt = `
You are an expert at virtual glasses try-on. I will provide you with two images:
1. A person's face photo
2. A pair of glasses

Please create a photorealistic image where the glasses are naturally placed on the person's face.

Requirements:
- Position the glasses correctly on the nose bridge and ears
- Match the perspective and angle of the face
- Adjust the size of the glasses to fit the face proportionally
- Match the lighting conditions of the original photo
- Ensure the glasses look natural and realistic
- Preserve the person's facial features, expression, and overall appearance
- Keep the background and photo quality unchanged
- Add natural shadows and reflections for the glasses

The result should look like the same person naturally wearing these glasses in their original photo.

${prompt}
`
```

**改进点**:
1. ✅ 保持第一版的简洁风格
2. ✅ 添加"Keep the background and photo quality unchanged"（轻度提醒）
3. ✅ 添加"Add natural shadows and reflections"（提高真实感）
4. ✅ 最后一句总结："The same person... in their original photo"（明确目标）
5. ✅ 没有过度使用"EXACT"、"CRITICAL"等强调词

---

## 📈 测试建议

1. **回滚到第一版**，验证效果是否确实最好
2. **测试微调版本**，看是否能在保持效果的同时略有改进
3. **A/B 测试**：
   - 版本 A：第一版原版
   - 版本 B：微调优化版
   - 对比：哪个更好地保持原图同时自然融合眼镜

---

## 🎯 核心教训

**Less is More（少即是多）**:
- 过度详细的指令可能适得其反
- AI 模型已经很智能，不需要过度指导
- 简洁、清晰、信任 AI 的能力 = 更好的结果

**平衡很重要**:
- 既要保持原图特征
- 又要允许 AI 做自然的融合
- 过度强调任何一方都会导致问题

