import { startRolePlaySession, sendRolePlayReply, giveUserFeedback } from '../services/rolePlay.service.js';

export async function startRolePlay(req, res) {
  try {
    const { text, language, userContext } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const session = await startRolePlaySession(text, language, userContext);
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start role play session' });
  }
}

export async function sendRolePlayMessage(req, res) {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required' });

    const reply = await sendRolePlayReply(sessionId, message);
    res.json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send role play message' });
  }
}

export async function getFeedback(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const feedback = await giveUserFeedback(sessionId);
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
}
