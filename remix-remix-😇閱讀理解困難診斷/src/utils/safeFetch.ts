/**
 * Safe fetch utility that prevents "Unexpected token '<', '<!doctype '... is not valid JSON"
 * errors by inspecting response content types, handling timeouts, and parsing text safely.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit,
  fallbackErrorMessage: string = "診斷服務暫時繁忙，請稍候重試。"
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";

    let rawText = "";
    try {
      rawText = await response.text();
    } catch (readErr: any) {
      return {
        ok: false,
        status: response.status,
        error: "無法讀取伺服器回應，請確認網路連線。",
      };
    }

    let parsed: any = null;
    const isJson =
      contentType.includes("application/json") ||
      rawText.trim().startsWith("{") ||
      rawText.trim().startsWith("[");

    if (isJson && rawText.trim().length > 0) {
      try {
        parsed = JSON.parse(rawText);
      } catch (jsonErr) {
        console.warn("JSON parse warning on text:", rawText.slice(0, 120));
      }
    }

    if (!response.ok) {
      const errorMsg =
        parsed?.error ||
        parsed?.message ||
        (response.status === 504 || response.status === 502
          ? "診斷模型深度運算中，請稍候片刻再點擊「重新嘗試」即可順暢取得結果！"
          : `${fallbackErrorMessage}（伺服器回應代碼：${response.status}）`);

      return {
        ok: false,
        status: response.status,
        error: errorMsg,
      };
    }

    if (parsed !== null && parsed !== undefined) {
      return {
        ok: true,
        status: response.status,
        data: parsed as T,
      };
    }

    return {
      ok: false,
      status: response.status,
      error: "伺服器返回格式非標準 JSON，請重試。",
    };
  } catch (err: any) {
    console.error("safeFetchJson network error:", err);
    return {
      ok: false,
      error: err?.message || fallbackErrorMessage,
    };
  }
}
