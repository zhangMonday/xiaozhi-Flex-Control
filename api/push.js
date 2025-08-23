export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { device_id, type, ...payload } = req.body || {};

    // 验证必填字段
    if (!device_id) {
      return res.status(400).json({ error: "Missing device_id" });
    }
    if (!type) {
      return res.status(400).json({ error: "Missing type" });
    }

    // 根据不同类型验证必要字段
    let requiredField = '';
    switch (type) {
      case 'chat':
      case 'music':
      case 'message':
      case 'qrcode':
        requiredField = 'text';
        break;
      case 'audio':
        requiredField = 'url';
        break;
      case 'radio':
        requiredField = 'id';
        break;
      case 'volume':
      case 'brightness':
        requiredField = 'value';
        break;
      case 'theme':
        requiredField = 'value';
        break;
      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    if (!payload[requiredField] && payload[requiredField] !== 0) {
      return res.status(400).json({ 
        error: `Missing required field for ${type}: ${requiredField}` 
      });
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
        error: "Push service failed", 
        detail: pushError.message 
      });
    }
  } catch (err) {
    console.error("API错误:", err);
    return res.status(500).json({ 
      status: "error",
      error: "Internal Server Error", 
      detail: err.message 
    });
  }
}
