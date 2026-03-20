export default async function handler(req, res) {
  // Permite apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome, sobrenome, email, whatsapp, bairro, interesse } = req.body;

  // Mapeia o interesse para um texto legível
  const interesseTexto = {
    classicos:    'Modelos Clássicos (Birkin, Kelly, Chanel Classic)',
    limitadas:    'Edições Limitadas e Raras',
    investimento: 'Peças como Investimento',
    presentear:   'Presentear Alguém Especial',
    todos:        'Todo o portfólio Relove',
  }[interesse] || interesse;

  try {
    // Chama o Claude para gerar uma mensagem de boas-vindas personalizada
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `Você é a assistente virtual da Relove, uma curadoria de bolsas de alto luxo de São Paulo.
Seu tom é sofisticado, caloroso e exclusivo — como uma consultora pessoal de luxo.
Escreva sempre em português do Brasil.`,
        messages: [
          {
            role: 'user',
            content: `Uma nova cliente se cadastrou no nosso portfólio exclusivo. Dados:
- Nome: ${nome} ${sobrenome || ''}
- Localização: ${bairro || 'não informado'}
- Interesse principal: ${interesseTexto}

Escreva uma mensagem de boas-vindas personalizada e sofisticada para enviar a ela.
Mencione o interesse específico dela. Seja breve (3-4 frases), elegante e exclusiva.
Não use emojis. Assine como "Equipe Relove".`
          }
        ]
      })
    });

    const claudeData = await claudeRes.json();
    const mensagem = claudeData?.content?.[0]?.text || 'Bem-vinda ao círculo Relove.';

    // ──────────────────────────────────────────────────────────
    // PRÓXIMO PASSO: enviar a mensagem por e-mail ou WhatsApp
    // Exemplos de integrações gratuitas:
    //
    // E-mail via Resend (resend.com — gratuito até 3.000 emails/mês):
    //   await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ from: 'relove@seudominio.com', to: email, subject: 'Bem-vinda à Relove', text: mensagem })
    //   });
    //
    // WhatsApp via Twilio (twilio.com — trial gratuito):
    //   await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, { ... })
    // ──────────────────────────────────────────────────────────

    console.log('=== NOVO LEAD RELOVE ===');
    console.log({ nome, sobrenome, email, whatsapp, bairro, interesse });
    console.log('Mensagem gerada pelo Claude:', mensagem);

    return res.status(200).json({ success: true, mensagem });

  } catch (err) {
    console.error('Erro na API de leads:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
