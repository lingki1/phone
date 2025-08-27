import { NextResponse } from 'next/server';

// 简易 PNG tEXt/zTXt 解析占位：真实实现可使用 png-chunks-extract + png-chunk-text 等库
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'file missing' }, { status: 400 });
  }

  // 这里返回空对象，前端已做类型保护；可在后续替换为真实解析
  return NextResponse.json({ metadata: {} });
}

