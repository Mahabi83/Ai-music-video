import { useState, useRef } from 'react'


const MODELS = {
  wan: {
    id: 'wan-video/wan-2.7-t2v',
    label: 'Wan 2.7',
    description: 'Best music sync',
  },
  kling: {
    id: 'kwaivgi/kling-v3-video',
    label: 'Kling v3',
    description: 'Cinematic look',
  },
}

export default function App() {
  const [apiToken, setApiToken] = useState(() => localStorage.getItem('replicate_token') || '')
  const [audioFile, setAudioFile] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('wan')
  const [duration, setDuration] = useState(5)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file)
      setError(null)
    } else {
      setError('Please upload a valid audio file')
    }
  }

  const generate = async () => {
    if (!apiToken.trim()) return setError('Replicate API token required')
    if (!audioFile) return setError('Upload an audio track')
    if (!prompt.trim()) return setError('Enter a visual prompt')

    setStatus('generating')
    setError(null)
    setVideoUrl(null)
    setProgress('Starting…')

    try {
      const audioBase64 = await fileToBase64(audioFile)
      const audioDataUri = `data:${audioFile.type};base64,${audioBase64}`

      let input = {}
      if (model === 'wan') {
        input = {
          prompt: prompt.trim(),
          audio: audioDataUri,
          aspect_ratio: '9:16',
          duration: Number(duration),
          resolution: '1080p',
          enable_prompt_expansion: true,
        }
      } else {
        input = {
          prompt: prompt.trim(),
          aspect_ratio: '9:16',
          duration: Number(duration),
          generate_audio: true,
          mode: 'pro',
        }
      }

      setProgress('Generating video… (30-90s)')
              const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: apiToken.trim(),
          model: MODELS[model].id,
          input,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const output = data.output

      let url = typeof output === 'string' ? output
        : Array.isArray(output) ? output[0]
        : output?.url || output?.[0]?.url

      if (!url) throw new Error('No video returned')
      setVideoUrl(url)
      setStatus('done')
    } catch (err) {
      setError(err.message || 'Generation failed')
      setStatus('error')
    }
  }

  const reset = () => {
    setAudioFile(null)
    setPrompt('')
    setVideoUrl(null)
    setStatus('idle')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-safe">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-12">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">AI Music Video</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track + prompt → 9:16 vertical video
          </p>
        </header>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Replicate API Token
            </label>
            <input
              type="password"
              value={apiToken}
onChange={(e) => {
  const v = e.target.value
  setApiToken(v)
  localStorage.setItem('replicate_token', v)
}}
  
              placeholder="r8_..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Audio Track
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-zinc-700 rounded-xl py-8 px-4 text-center active:bg-zinc-900 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a"
                className="hidden"
              />
              {audioFile ? (
                <div className="text-sm">
                  <div className="text-violet-400 font-medium truncate">{audioFile.name}</div>
                  <div className="text-zinc-500 text-xs mt-1">
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              ) : (
                <div className="text-zinc-400 text-sm">Tap to upload audio</div>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Visual Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Neon city at night, rain, cyberpunk, camera slowly pushing forward..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {Object.entries(MODELS).map(([key, m]) => (
                  <option key={key} value={key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {[3, 5, 8, 10, 12, 15].map((d) => (
                  <option key={d} value={d}>{d}s</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/60 border border-red-900 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={generate}
            disabled={status === 'generating'}
            className="w-full bg-violet-600 active:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white font-medium rounded-xl py-4 text-base transition"
          >
            {status === 'generating' ? 'Generating…' : 'Generate Video'}
          </button>

          {status === 'generating' && (
            <p className="text-center text-sm text-zinc-400 animate-pulse">
              {progress}
            </p>
          )}

          {videoUrl && (
            <div className="pt-4 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-[9/16]">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-3">
                <a
                  href={videoUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center bg-zinc-800 active:bg-zinc-700 rounded-xl py-3.5 text-sm font-medium"
                >
                  Download
                </a>
                <button
                  onClick={reset}
                  className="flex-1 text-center border border-zinc-700 active:bg-zinc-900 rounded-xl py-3.5 text-sm"
                >
                  New Video
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
