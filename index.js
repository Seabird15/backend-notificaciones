require('dotenv').config()
const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')

const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db  = admin.firestore()
const app = express()
app.use(cors())
app.use(express.json())

app.post('/enviar', async (req, res) => {
  const { title, body } = req.body
  console.log('Body recibido:', req.body)

  try {
    const snap = await db.collection('pushTokens').get()
    const tokens = snap.docs.map(d => d.data().token).filter(Boolean)

    if (!tokens.length) return res.status(404).json({ error: 'No hay tokens' })

    let success = 0
    let failure = 0

    // Envía uno por uno o en lotes pequeños con send()
    for (const token of tokens) {
      const message = {
        token,
        notification: {
          title: title || 'Nuevo aviso',
          body: body || 'Tienes una nueva notificación 💬',
        },
      }

      try {
        await admin.messaging().send(message)
        success++
          console.log('Notificación enviada a token:', token)
      } catch (e) {
        failure++
        console.error('Error con token:', token, e)
      }
    }

    res.json({ successCount: success, failureCount: failure })
  } catch (err) {
    console.error('Error al enviar notificación:', err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`))
