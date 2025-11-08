// Fetch and display a random prompt
async function loadPrompt() {
  try {
    const response = await fetch('/api/prompt')
    const data = await response.json()
    const promptDiv = document.getElementById('prompt')
    promptDiv.textContent = data.prompt
      ? `${data.prompt.genre}: ${data.prompt.elements.join(', ')}`
      : 'No prompt available today.'
  } catch (err) {
    console.error('Failed to load prompt:', err)
  }
}

// Save story (localStorage version to start)
document.getElementById('saveBtn').addEventListener('click', () => {
  const text = document.getElementById('story').value.trim()
  if (!text) return alert('Please write something first!')
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(`story-${today}`, text)
  alert('Story saved!')
})

loadPrompt()
