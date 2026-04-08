exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { item } = JSON.parse(event.body || '{}');
  if(!item) return { statusCode: 400, body: 'Missing item' };

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: 'אתה עוזר לזוג ישראלי שעובר דירה. ענה תמיד בעברית. ענה רק JSON תקין ללא כלום מחוצה לו.',
      messages: [{
        role: 'user',
        content: `מה המחיר הממוצע של "${item}" בישראל? החזר JSON בלבד עם שדות: new_min, new_max, used_min, used_max, tip (טיפ קצר איפה לקנות בישראל - יד2, KSP, שופרסל וכו'). מספרים בשקלים ללא סימנים.`
      }]
    })
  });

  const data = await resp.json();
  const text = data.content?.[0]?.text || '{}';
  const clean = text.replace(/```json|```/g,'').trim();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: clean
  };
};
