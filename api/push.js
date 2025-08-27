export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "方法不允许" });
    }

    const { device_id, type, ...payload } = req.body || {};

    // 验证必填字段
    if (!device_id) {
      return res.status(400).json({ error: "缺少 device_id" });
    }
    if (!type) {
      return res.status(400).json({ error: "缺少 type" });
    }

    // 根据不同类型验证必要字段
    let requiredFields = [];
    switch (type) {
      case 'chat':
      case 'music':
      case 'message':
      case 'qrcode':
        requiredFields = [ 'text' ];
        break;
      case 'audio':
      case 'image':
        requiredFields = [ 'url' ];
        break;
      case 'radio':
        requiredFields = [ 'id' ];
        break;
      case 'volume':
      case 'brightness':
        requiredFields = [ 'value' ];
        break;
      case 'theme':
        requiredFields = [ 'value' ];
        break;
      case 'mijia':
        requiredFields = ['name', 'ip', 'token', 'did', 'siid', 'state'];
        break;
      default:
        return res.status(400).json({ error: "无效的 type" });
    }

    for (const field of requiredFields) {
      if (!payload[field] && payload[field] !== 0) {
        return res.status(400).json({ 
          error: `缺少 ${type} 所需的字段: ${field}` 
        });
      }
    }

    try {
      const resp = await fetch("https://nodelua.com/home_iot/api/push.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          device_id,
          type,
          ...payload
        })
      });

      const result = await resp.json();

      return res.status(resp.status).json({
        status: resp.ok ? "success" : "error",
        message: resp.ok ? "推送成功" : "推送失败",
        data: result,
        httpStatus: resp.status
      });
    } catch (pushError) {
      console.error("推送失败:", pushError);
      return res.status(502).json({ 
        status: "error",
        error: "推送服务失败", 
        detail: pushError.message 
      });
    }
  } catch (err) {
    console.error("API错误:", err);
    return res.status(500).json({ 
      status: "error",
      error: "内部服务器错误", 
      detail: err.message 
    });
  }
}
