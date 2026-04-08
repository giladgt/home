exports.handler = async (event) => {
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'}, body: '' };
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const { item, type } = JSON.parse(event.body || '{}');
  if(!item) return { statusCode: 400, body: JSON.stringify({error:'Missing item'}) };

  const isPro = type === 'professional';

  const prompt = isPro
    ? `מה עולה שירות של "${item}" בישראל? החזר JSON בלבד, ללא טקסט מחוץ ל-JSON, עם שדות בדיוק: min_price (מספר בשקלים), max_price (מספר בשקלים), unit (יחידה כמו "לשעה" או "לעבודה"), tip (טיפ קצר איך למצוא ולמה לשים לב בישראל). דוגמה: {"min_price":200,"max_price":500,"unit":"לעבודה","tip":"בדוק ביד2 ובאפליקציית הממונה"}`
    : `מה המחיר של "${item}" בישראל? החזר JSON בלבד, ללא טקסט מחוץ ל-JSON, עם שדות בדיוק: new_min (מספר), new_max (מספר), used_min (מספר), used_max (מספר), tip (טיפ קצר איפה לקנות). דוגמה: {"new_min":2000,"new_max":5000,"used_min":800,"used_max":2000,"tip":"זמין ביבואן ובמחסני חשמל"}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'אתה מומחה מחירים בשוק הישראלי. ענה תמיד ב-JSON תקין בלבד, ללא שום טקסט לפני או אחרי ה-JSON. אל תוסיף ```json או כל סימן אחר.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await resp.json();
    let text = data.content?.[0]?.text || '';
    text = text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if(start !== -1 && end !== -1) text = text.slice(start, end+1);

    const parsed = JSON.parse(text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(parsed)
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
